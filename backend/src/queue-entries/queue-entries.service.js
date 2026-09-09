import { Injectable, Dependencies, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateDistanceKm } from '../utils/geo.util';
import { RedisService } from '../redis/redis.service';

@Injectable()
@Dependencies(PrismaService, RedisService)
export class QueueEntriesService {
  constructor(prisma, redisService) {
    this.prisma = prisma;
    this.redisService = redisService;
  }

  async publishQueueUpdate(queueId, businessId, eventType = 'queue.updated') {
    if (!businessId) {
      const queue = await this.prisma.queue.findUnique({ where: { id: queueId } });
      businessId = queue?.businessId;
    }
    if (this.redisService && businessId) {
      // Step 15: Granular event publishing
      await this.redisService.publish('queue-updates', { queueId, businessId, eventType });
      
      // Step 13: Event-Driven Invalidation
      await this.redisService.del(`business:${businessId}:landing_static`);
      
      this.updateQueueSnapshot(queueId, businessId);
    }
  }

  async updateQueueSnapshot(queueId, businessId) {
    if (!this.redisService) return;
    
    // Improvement 4: Maintain lightweight read-optimized state
    const [queue, waitingCount, activeCounters] = await Promise.all([
      this.prisma.queue.findUnique({ where: { id: queueId }, include: { service: true } }),
      this.prisma.queueEntry.count({ where: { queueId, status: 'WAITING' } }),
      this.prisma.counter.count({ where: { businessId, status: { not: 'OFFLINE' } } })
    ]);

    if (queue) {
      const estimatedWait = waitingCount * (queue.service?.estimatedDuration || 15);
      const snapshot = {
        currentToken: queue.currentToken,
        waiting: waitingCount,
        activeCounters,
        estimatedWait,
        status: queue.status,
        updatedAt: new Date().toISOString()
      };
      await this.redisService.set(`queue:${queueId}:snapshot`, JSON.stringify(snapshot));
    }
  }

  async joinQueue(queueId, userId, locationData) {
    // Duplicate prevention: If userId is provided, check if they are already waiting
    if (userId) {
      const existing = await this.prisma.queueEntry.findFirst({
        where: { queueId, userId, status: { in: ['WAITING', 'CALLED'] } }
      });
      if (existing) {
        throw new BadRequestException('You are already in this queue.');
      }
    }

    // Transactional token generation
    return this.prisma.$transaction(async (tx) => {
      const queue = await tx.queue.findUnique({ 
        where: { id: queueId },
        include: { business: true, service: true }
      });
      if (!queue) throw new NotFoundException('Queue not found');
      if (queue.status !== 'OPEN') throw new BadRequestException('Queue is not open');

      // Check max capacity
      if (queue.maxCapacity) {
        const currentCount = await tx.queueEntry.count({
          where: { queueId, status: { in: ['WAITING', 'CALLED'] } }
        });
        if (currentCount >= queue.maxCapacity) {
          throw new BadRequestException('Queue is at maximum capacity');
        }
      }

      // Geofencing Check
      if ((queue.locationRequired || queue.service?.requiresLocation) && queue.business.latitude && queue.business.longitude) {
        if (!locationData || !locationData.lat || !locationData.lng) {
          throw new BadRequestException('Location data is required to join this queue.');
        }

        const distanceKm = calculateDistanceKm(
          locationData.lat, 
          locationData.lng, 
          queue.business.latitude, 
          queue.business.longitude
        );

        const distanceMeters = distanceKm * 1000;
        const allowedRadius = queue.business.geofenceRadius || 100;

        // Enforce branch-specific radius limit
        if (distanceKm === null || distanceMeters > allowedRadius) {
          throw new BadRequestException(`Please move closer to the location to join the queue. Must be within ${allowedRadius}m.`);
        }
      }
      
      // Authoritative database increment to guarantee zero duplicates
      const updatedQueue = await tx.queue.update({
        where: { id: queueId },
        data: { currentToken: { increment: 1 } },
        select: { currentToken: true }
      });
      const newTokenNumber = updatedQueue.currentToken;

      // Create entry
      const entry = await tx.queueEntry.create({
        data: {
          queueId,
          userId,
          tokenNumber: newTokenNumber,
          status: 'WAITING',
          locationLat: locationData?.lat,
          locationLng: locationData?.lng,
          locationAccuracy: locationData?.accuracy,
          formData: locationData?.formData, // Storing submitted custom form data
        }
      });
      
      this.publishQueueUpdate(queueId, queue.businessId, 'queue.customer_joined');
      return entry;
    });
  }

  async cancelEntry(id, userId) {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    
    // If not called by admin, check ownership
    if (userId !== 'ADMIN' && entry.userId !== userId) {
      throw new BadRequestException('Unauthorized');
    }
    
    if (entry.status !== 'WAITING') throw new BadRequestException('Can only cancel waiting entries');

    const updated = await this.prisma.queueEntry.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { queue: true }
    });
    
    this.publishQueueUpdate(updated.queueId, updated.queue.businessId, 'queue.customer_cancelled');
    return updated;
  }

  async getTestActiveEntries() {
    const activeEntries = await this.prisma.queueEntry.findMany({
      where: {
        status: { in: ['WAITING', 'CALLED', 'SERVING'] }
      },
      include: {
        queue: {
          include: {
            business: {
              select: { name: true }
            },
            service: { select: { name: true, estimatedDuration: true } }
          }
        },
        user: { select: { name: true, email: true } }
      },
      orderBy: { tokenNumber: 'asc' },
      take: 1
    });

    for (const entry of activeEntries) {
      if (entry.status === 'WAITING') {
        const peopleAhead = await this.prisma.queueEntry.count({
          where: {
            queueId: entry.queueId,
            status: 'WAITING',
            tokenNumber: { lt: entry.tokenNumber }
          }
        });
        entry.peopleAhead = peopleAhead;
        entry.estimatedWaitMins = (peopleAhead + 1) * (entry.queue.service?.estimatedDuration || 15);
      }
    }

    return activeEntries;
  }

  async getEntryById(id, userId) {
    const entry = await this.prisma.queueEntry.findUnique({
      where: { id },
      include: {
        queue: {
          include: {
            business: { select: { name: true } },
            service: { select: { name: true, estimatedDuration: true } }
          }
        }
      }
    });

    if (!entry) throw new NotFoundException('Queue entry not found');

    if (entry.assignedCounterId) {
      const counter = await this.prisma.counter.findUnique({
        where: { id: entry.assignedCounterId },
        select: { name: true }
      });
      entry.assignedCounter = counter;
    }

    if (entry.status === 'WAITING') {
      const peopleAhead = await this.prisma.queueEntry.count({
        where: {
          queueId: entry.queueId,
          status: 'WAITING',
          tokenNumber: { lt: entry.tokenNumber }
        }
      });
      entry.peopleAhead = peopleAhead;
      entry.estimatedWaitMins = (peopleAhead + 1) * (entry.queue.service?.estimatedDuration || 15);
    } else {
      entry.peopleAhead = 0;
      entry.estimatedWaitMins = 0;
    }

    // Now Serving info
    const nowServing = await this.prisma.queueEntry.findFirst({
      where: { queueId: entry.queueId, status: { in: ['CALLED', 'SERVING'] } },
      orderBy: { tokenNumber: 'asc' }
    });
    
    entry.nowServingToken = nowServing ? nowServing.tokenNumber : null;

    return entry;
  }

  async getUserActiveEntries(userId) {
    const activeEntries = await this.prisma.queueEntry.findMany({
      where: {
        userId,
        status: { in: ['WAITING', 'CALLED', 'SERVING'] }
      },
      include: {
        queue: {
          include: {
            business: {
              select: { name: true }
            },
            service: { select: { name: true, estimatedDuration: true } }
          }
        },
        user: { select: { name: true, email: true } }
      }
    });

    // Enhance with "people ahead" and "ETA" for WAITING entries
    for (const entry of activeEntries) {
      if (entry.status === 'WAITING') {
        const peopleAhead = await this.prisma.queueEntry.count({
          where: {
            queueId: entry.queueId,
            status: 'WAITING',
            tokenNumber: { lt: entry.tokenNumber }
          }
        });
        entry.peopleAhead = peopleAhead;
        entry.estimatedWaitMins = (peopleAhead + 1) * (entry.queue.service?.estimatedDuration || 15);
      }
    }

    return activeEntries;
  }

  async callNext(queueId, counterId) {
    return this.prisma.$transaction(async (tx) => {
      // Find the next waiting entry
      const nextEntry = await tx.queueEntry.findFirst({
        where: { queueId, status: 'WAITING' },
        orderBy: [
          { priority: 'desc' },
          { joinedAt: 'asc' }
        ]
      });

      if (!nextEntry) throw new NotFoundException('No waiting entries in this queue');

      // Assign counter and update status
      const updated = await tx.queueEntry.update({
        where: { id: nextEntry.id },
        data: { 
          status: 'CALLED',
          calledAt: new Date(),
          assignedCounterId: counterId
        }
      });

      // Update counter status
      if (counterId) {
        await tx.counter.update({
          where: { id: counterId },
          data: { status: 'BUSY', currentQueueEntryId: updated.id }
        });
      }

      this.publishQueueUpdate(queueId, undefined, 'queue.customer_called');
      return updated;
    });
  }

  async completeService(id, counterId) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.queueEntry.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
      
      if (counterId) {
        await tx.counter.update({
          where: { id: counterId },
          data: { status: 'AVAILABLE', currentQueueEntryId: null }
        });
      }
      this.publishQueueUpdate(entry.queueId, undefined, 'queue.customer_completed');
      return entry;
    });
  }

  async markNoShow(id, counterId) {
    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.queueEntry.update({
        where: { id },
        data: { status: 'NO_SHOW' }
      });
      
      if (counterId) {
        await tx.counter.update({
          where: { id: counterId },
          data: { status: 'AVAILABLE', currentQueueEntryId: null }
        });
      }
      this.publishQueueUpdate(entry.queueId, undefined, 'queue.customer_noshow');
      return entry;
    });
  }

  async getBusinessEntries(businessId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.queueEntry.findMany({
      where: {
        queue: { businessId },
        joinedAt: { gte: today }
      },
      orderBy: { joinedAt: 'desc' },
      include: {
        queue: {
          include: { service: true }
        },
        user: { select: { name: true, email: true } }
      }
    });
  }

  async getUserTickets(userId) {
    if (!userId) throw new BadRequestException('User ID required');
    const entries = await this.prisma.queueEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        queue: {
          include: {
            business: { select: { name: true } },
            service: { select: { name: true } }
          }
        }
      }
    });
    
    // manual assignedCounter fetch
    for (const entry of entries) {
      if (entry.assignedCounterId) {
        entry.assignedCounter = await this.prisma.counter.findUnique({ where: { id: entry.assignedCounterId }, select: { name: true } });
      }
    }
    return entries;
  }

}



