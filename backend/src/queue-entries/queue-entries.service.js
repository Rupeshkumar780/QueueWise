import { Injectable, Dependencies, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateDistanceKm } from '../utils/geo.util';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
@Dependencies(PrismaService, EventsGateway)
export class QueueEntriesService {
  constructor(prisma, eventsGateway) {
    this.prisma = prisma;
    this.eventsGateway = eventsGateway;
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
        include: { branch: true }
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
      if (queue.locationRequired && queue.branch.latitude && queue.branch.longitude) {
        if (!locationData || !locationData.lat || !locationData.lng) {
          throw new BadRequestException('Location data is required to join this queue.');
        }

        const distanceKm = calculateDistanceKm(
          locationData.lat, 
          locationData.lng, 
          queue.branch.latitude, 
          queue.branch.longitude
        );

        const distanceMeters = distanceKm * 1000;
        const allowedRadius = queue.branch.geofenceRadius || 100;

        // Enforce branch-specific radius limit
        if (distanceKm === null || distanceMeters > allowedRadius) {
          throw new BadRequestException(`Please move closer to the location to join the queue. Must be within ${allowedRadius}m.`);
        }
      }
      
      const newTokenNumber = queue.currentToken + 1;

      // Update queue token
      await tx.queue.update({
        where: { id: queueId },
        data: { currentToken: newTokenNumber },
      });

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
      
      this.eventsGateway.broadcastQueueUpdate(queueId);
      return entry;
    });
  }

  async cancelEntry(id, userId) {
    const entry = await this.prisma.queueEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Entry not found');
    if (entry.userId !== userId) throw new BadRequestException('Unauthorized');
    if (entry.status !== 'WAITING') throw new BadRequestException('Can only cancel waiting entries');

    const updated = await this.prisma.queueEntry.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    
    this.eventsGateway.broadcastQueueUpdate(updated.queueId);
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
            branch: {
              select: { name: true, business: { select: { name: true } } }
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

  async getUserActiveEntries(userId) {
    const activeEntries = await this.prisma.queueEntry.findMany({
      where: {
        userId,
        status: { in: ['WAITING', 'CALLED', 'SERVING'] }
      },
      include: {
        queue: {
          include: {
            branch: {
              select: { name: true, business: { select: { name: true } } }
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

      this.eventsGateway.broadcastQueueUpdate(queueId);
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
      this.eventsGateway.broadcastQueueUpdate(entry.queueId);
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
      this.eventsGateway.broadcastQueueUpdate(entry.queueId);
      return entry;
    });
  }
}

