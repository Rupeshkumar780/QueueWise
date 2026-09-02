import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class BusinessesService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(data, ownerId) {
    return this.prisma.business.create({
      data: {
        ...data,
        ownerId,
      },
    });
  }

  async update(id, data) {
    return this.prisma.business.update({
      where: { id },
      data,
    });
  }

  async findMine(ownerId) {
    return this.prisma.business.findMany({
      where: { ownerId },
    });
  }

  async findAll(city, search) {
    const where = {};
    
    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }
    
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    return this.prisma.business.findMany({
      where
    });
  }

  async findOne(id) {
    const business = await this.prisma.business.findUnique({ where: { id } });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async getCustomerLandingData(businessId) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        services: {
          where: { active: true },
          include: {
            queues: {
              where: { status: 'OPEN' }
            }
          }
        }
      }
    });

    if (!business) throw new NotFoundException('Business not found');

    const servicesWithWaitTimes = business.services.map(service => {
      const activeQueue = service.queues[0];
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        requiresLocation: service.requiresLocation,
        estimatedDuration: service.estimatedDuration,
        queueStatus: activeQueue ? activeQueue.status : 'CLOSED',
        queueId: activeQueue ? activeQueue.id : null,
      };
    });

    return {
      business: {
        id: business.id,
        name: business.name,
        address: business.address,
        isOpen: business.isOpen,
        latitude: business.latitude,
        longitude: business.longitude,
        geofenceRadius: business.geofenceRadius
      },
      services: servicesWithWaitTimes,
    };
  }

  async getDashboardStats(businessId) {
    // Quick overview stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalServed, currentWaiting, activeCounters, openQueues] = await Promise.all([
      this.prisma.queueEntry.count({
        where: {
          queue: { businessId },
          status: 'COMPLETED',
          createdAt: { gte: today }
        }
      }),
      this.prisma.queueEntry.count({
        where: {
          queue: { businessId },
          status: 'WAITING'
        }
      }),
      this.prisma.counter.count({
        where: {
          businessId,
          status: { in: ['AVAILABLE', 'BUSY'] }
        }
      }),
      this.prisma.queue.count({
        where: {
          businessId,
          status: 'OPEN'
        }
      })
    ]);

    return {
      totalServedToday: totalServed,
      currentWaiting,
      activeCounters,
      openQueues
    };
  }

  async getLiveOperations(businessId) {
    // Used for the live ops dashboard view
    const [queues, counters] = await Promise.all([
      this.prisma.queue.findMany({
        where: { businessId },
        include: {
          service: true,
          entries: {
            where: { status: 'WAITING' },
            orderBy: [
              { priority: 'desc' },
              { joinedAt: 'asc' }
            ]
          }
        }
      }),
      this.prisma.counter.findMany({
        where: { businessId }
      })
    ]);

    return { queues, counters };
  }
}
