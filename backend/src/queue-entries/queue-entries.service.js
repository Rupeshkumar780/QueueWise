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
      await this.redisService.del(`business:${businessId}:landing`);
      await this.redisService.del(`business:${businessId}:dashboard`);
      await this.redisService.del(`business:${businessId}:analytics`);
      
      this.updateQueueSnapshot(queueId, businessId);
    }
  }

  async updateQueueSnapshot(queueId, businessId) {
    if (!this.redisService) return;
    
    // Improvement: Instead of performing multiple DB queries to recalculate after every mutation,
    // we simply invalidate the cache. The next read operation will lazily rebuild it.
    await this.redisService.del(`queue:${queueId}:live`);
  }

  async joinQueue(queueId, userId, locationData) {
    // Transactional token generation & concurrency protection
    const entry = await this.prisma.$transaction(async (tx) => {
      // Duplicate prevention (inside transaction to prevent race conditions)
      if (userId) {
        const existing = await tx.queueEntry.findFirst({
          where: { queueId, userId, status: { in: ['WAITING', 'CALLED'] } }
        });
        if (existing) {
          throw new BadRequestException('You are already in this queue.');
        }
      }

      const queue = await tx.queue.findUnique({ 
        where: { id: queueId },
        include: { business: true, service: true }
      });
      if (!queue) throw new NotFoundException('Queue not found');
      if (queue.status !== 'OPEN') {
        const operationalCounters = await tx.counter.count({
          where: {
            businessId: queue.businessId,
            supportedServices: { has: queue.serviceId },
            status: { not: 'OFFLINE' }
          }
        });
        if (operationalCounters === 0) throw new BadRequestException('Queue is not open');
      }

      // Check max capacity
      if (queue.maxCapacity) {
        const currentCount = await tx.queueEntry.count({
          where: { queueId, status: { in: ['WAITING', 'CALLED'] } }
        });
        if (currentCount >= queue.maxCapacity) {
          throw new BadRequestException('Queue is at maximum capacity');
        }
      }

      // Every queue join is location-verified. The server remains authoritative
      // so a customer cannot bypass geofencing by calling the API directly.
      const hasBusinessCoordinates = Number.isFinite(queue.business.latitude)
        && Number.isFinite(queue.business.longitude);
      if (!hasBusinessCoordinates) {
        throw new BadRequestException('This business has not configured a valid location.');
      }

      if (!locationData || !Number.isFinite(locationData.lat) || !Number.isFinite(locationData.lng)) {
        throw new BadRequestException('Location permission is required to join this queue.');
      }

      const distanceKm = calculateDistanceKm(
        locationData.lat,
        locationData.lng,
        queue.business.latitude,
        queue.business.longitude
      );
      const allowedRadius = queue.locationRadius || queue.business.geofenceRadius;
      const distanceMeters = distanceKm * 1000;

      if (!Number.isFinite(distanceKm) || !Number.isFinite(allowedRadius) || allowedRadius <= 0 || distanceMeters > allowedRadius) {
        throw new BadRequestException(`Please move closer to the location to join the queue. Must be within ${allowedRadius || 100}m.`);
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
      
      return entry;
    });

    this.publishQueueUpdate(queueId, undefined, 'queue.customer_joined').catch(() => {});
    return entry;
  }

  async cancelEntry(id, userId) {
    const updated = await this.prisma.$transaction(async (tx) => {
      // Find entry inside transaction with a write lock to prevent race conditions during cancellation
      const entries = await tx.$queryRaw`
        SELECT * FROM "QueueEntry" 
        WHERE id = ${id} FOR UPDATE
      `;
      const entry = entries && entries.length > 0 ? entries[0] : null;

      if (!entry) throw new NotFoundException('Entry not found');
      
      // If not called by admin, check ownership
      if (userId !== 'ADMIN' && entry.userId !== userId) {
        throw new BadRequestException('Unauthorized');
      }
      
      if (entry.status !== 'WAITING') throw new BadRequestException('Can only cancel waiting entries');

      const updated = await tx.queueEntry.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { queue: true }
      });
      
      return updated;
    });

    this.publishQueueUpdate(updated.queueId, updated.queue.businessId, 'queue.customer_cancelled').catch(() => {});
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

    // Enhance with "people ahead" and "ETA" for WAITING entries concurrently
    await Promise.all(activeEntries.map(async (entry) => {
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
    }));

    return activeEntries;
  }

  async callNext(queueId, counterId) {
    const updated = await this.prisma.$transaction(async (tx) => {
      // Find the next waiting entry using raw SQL with SKIP LOCKED to prevent race conditions
      const nextEntries = await tx.$queryRaw`
        SELECT id FROM "QueueEntry"
        WHERE "queueId" = ${queueId} AND "status" = 'WAITING'
        ORDER BY "priority" DESC, "joinedAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

      if (!nextEntries || nextEntries.length === 0) throw new NotFoundException('No waiting entries in this queue');
      
      const nextEntry = nextEntries[0];

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

      return updated;
    });

    this.publishQueueUpdate(queueId, undefined, 'queue.customer_called').catch(() => {});
    return updated;
  }

  async completeService(id, counterId) {
    const entry = await this.prisma.$transaction(async (tx) => {
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
      return entry;
    });

    this.publishQueueUpdate(entry.queueId, undefined, 'queue.customer_completed').catch(() => {});
    return entry;
  }

  async markNoShow(id, counterId) {
    const entry = await this.prisma.$transaction(async (tx) => {
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
      return entry;
    });

    this.publishQueueUpdate(entry.queueId, undefined, 'queue.customer_noshow').catch(() => {});
    return entry;
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
    
    // manual assignedCounter fetch batched
    const counterIds = [...new Set(entries.map(e => e.assignedCounterId).filter(Boolean))];
    if (counterIds.length > 0) {
      const counters = await this.prisma.counter.findMany({
        where: { id: { in: counterIds } },
        select: { id: true, name: true }
      });
      const counterMap = Object.fromEntries(counters.map(c => [c.id, c]));
      for (const entry of entries) {
        if (entry.assignedCounterId) {
          entry.assignedCounter = counterMap[entry.assignedCounterId];
        }
      }
    }
    return entries;
  }

}



