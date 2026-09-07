import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
@Dependencies(PrismaService, RedisService)
export class BusinessesService {
  constructor(prisma, redisService) {
    this.prisma = prisma;
    this.redisService = redisService;
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

  async findMine(userId) {
    return this.prisma.business.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { staff: { some: { id: userId } } }
        ]
      },
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
    const business = await this.prisma.business.findUnique({ 
      where: { id },
      include: {
        staff: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async addStaff(businessId, data) {
    // Check if user already exists
    let user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      const argon2 = require('argon2');
      const passwordHash = await argon2.hash(data.tempPassword);
      user = await this.prisma.user.create({
        data: {
          name: data.name || data.email.split('@')[0],
          email: data.email,
          passwordHash,
          role: data.role || 'STAFF',
        }
      });
    } else {
      // Update role if they were CUSTOMER
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: data.role || 'STAFF' }
      });
    }

    // Link to business
    return this.prisma.business.update({
      where: { id: businessId },
      data: {
        staff: {
          connect: { id: user.id }
        }
      }
    });
  }

  async removeStaff(businessId, userId) {
    const result = await this.prisma.business.update({
      where: { id: businessId },
      data: {
        staff: {
          disconnect: { id: userId }
        }
      }
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { staffAt: true, businesses: true }
    });

    if (user && user.staffAt.length === 0 && user.businesses.length === 0 && user.role === 'STAFF') {
      await this.prisma.user.delete({ where: { id: userId } });
    }

    return result;
  }

  async getAnalytics(businessId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all queues for this business
    const queues = await this.prisma.queue.findMany({
      where: { businessId },
      include: { service: true }
    });

    const queueIds = queues.map(q => q.id);

    // Get today's entries
    const todayEntries = await this.prisma.queueEntry.findMany({
      where: {
        queueId: { in: queueIds },
        joinedAt: { gte: today }
      }
    });

    // 1. DISTRIBUTION: Tickets per service today
    const distribution = queues.map(q => {
      const count = todayEntries.filter(e => e.queueId === q.id).length;
      return {
        name: q.service.name,
        value: count || 0,
        color: 'bg-blue-500' // Frontend handles cycling colors if needed
      };
    });

    // 2. PERFORMANCE: Real wait time calculation
    const completedToday = todayEntries.filter(e => e.status === 'COMPLETED' && e.completedAt);
    let avgWaitTime = 0;
    if (completedToday.length > 0) {
      const totalWaitMs = completedToday.reduce((sum, e) => sum + (e.completedAt.getTime() - e.joinedAt.getTime()), 0);
      avgWaitTime = Math.round((totalWaitMs / completedToday.length) / 60000); // in minutes
    }

    const performance = [
      { name: 'Avg Wait Time (mins)', avg: avgWaitTime },
      { name: 'Total Served Today', avg: completedToday.length }
    ];

    // 3. QUEUE CROWD TODAY: Real bucketing by hour (extended to late night)
    const queueCrowd = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
    const timeLabels = ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'];
    
    todayEntries.forEach(entry => {
      const hour = entry.joinedAt.getHours();
      if (hour >= 9 && hour <= 23) {
        queueCrowd[hour - 9]++;
      }
    });

    // 4. DAILY ACTIVITY: Real data for the current Monday-Sunday week
    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysSinceMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const recentEntries = await this.prisma.queueEntry.findMany({
      where: {
        queueId: { in: queueIds },
        completedAt: { gte: weekStart, lt: weekEnd, not: null },
        status: 'COMPLETED'
      }
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyMap = {};
    
    // Initialize Monday through Sunday in chronological order.
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      dailyMap[dayNames[d.getDay()]] = 0;
    }

    recentEntries.forEach(entry => {
      const dayName = dayNames[entry.completedAt.getDay()];
      if (dailyMap[dayName] !== undefined) {
        dailyMap[dayName]++;
      }
    });

    const dailyActivity = Object.keys(dailyMap).map(day => ({ day, count: dailyMap[day] }));

    return {
      queueCrowd,
      timeLabels,
      dailyActivity,
      distribution,
      performance
    };
  }

  async getCustomerLandingData(businessId) {
    // REDIS CACHE: Check if landing data is cached (Layer 2)
    const cacheKey = `business:${businessId}:landingData`;
    if (this.redisService?.getClient()) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (e) {
        console.error("Redis Cache Read Error", e);
      }
    }
    // Fetch business + services + queues (counters belong to business, not queue)
    const [business, businessCounters] = await Promise.all([
      this.prisma.business.findUnique({
        where: { id: businessId },
        include: {
          services: {
            where: { active: true },
            include: {
              queues: true  // All queues for this service
            }
          }
        }
      }),
      this.prisma.counter.findMany({
        where: { businessId },
        select: { id: true, name: true, status: true, supportedServices: true }
      })
    ]);

    if (!business) throw new NotFoundException('Business not found');

    const servicesWithWaitTimes = business.services.map(service => {
      // Find the OPEN queue (if any)
      const openQueue = service.queues.find(q => q.status === 'OPEN');
      const anyQueue = service.queues[0]; // fallback

      // Find counters that support this service
      const serviceCounters = businessCounters.filter(c => 
        c.supportedServices && c.supportedServices.includes(service.id)
      );

      // Aggregate counter statuses
      let counterSummary = null;
      if (serviceCounters.length > 0) {
        const total = serviceCounters.length;
        const activeCounters = serviceCounters.filter(c => c.status !== 'OFFLINE').length;
        const busyCounters = serviceCounters.filter(c => c.status === 'BUSY').length;
        const offlineCounters = serviceCounters.filter(c => c.status === 'OFFLINE').length;
        counterSummary = { total, activeCounters, busyCounters, offlineCounters };
      }

      // Compute a meaningful display status
      let displayStatus = openQueue ? openQueue.status : (anyQueue ? anyQueue.status : 'CLOSED');
      if (counterSummary && counterSummary.activeCounters === 0 && counterSummary.total > 0) {
        displayStatus = 'OFFLINE'; // All counters offline
      } else if (counterSummary && counterSummary.busyCounters === counterSummary.activeCounters && counterSummary.busyCounters > 0) {
        displayStatus = 'BUSY'; // All active counters are busy
      }

      return {
        id: service.id,
        name: service.name,
        description: service.description,
        requiresLocation: service.requiresLocation,
        estimatedDuration: service.estimatedDuration,
        queueStatus: displayStatus,
        queueId: openQueue ? openQueue.id : (anyQueue ? anyQueue.id : null),
        counterSummary,
        queues: service.queues.map(q => ({ id: q.id, status: q.status })),
      };
    });

    // 1. Live Queue Intelligence
    const currentWaiting = await this.prisma.queueEntry.count({
      where: { queue: { businessId }, status: 'WAITING' }
    });
    
    const activeCounters = await this.prisma.counter.count({
      where: { businessId, status: { not: 'OFFLINE' } }
    });
    const totalCounters = await this.prisma.counter.count({
      where: { businessId }
    });

    // Calculate real avg wait time
    let totalEstWaitMins = 0;
    const waitingEntries = await this.prisma.queueEntry.findMany({
      where: { queue: { businessId }, status: 'WAITING' },
      include: { queue: { include: { service: true } } }
    });
    for(let w of waitingEntries) {
        totalEstWaitMins += (w.queue.service?.estimatedDuration || 15);
    }
    const avgWaitTime = currentWaiting > 0 ? Math.ceil(totalEstWaitMins / Math.max(1, activeCounters)) : 0;
    
    let queueHealth = '🟢 Normal';
    if (avgWaitTime > 45) queueHealth = '🔴 Very Busy';
    else if (avgWaitTime > 20) queueHealth = '🟡 Busy';

    const intelligence = {
      queueLength: currentWaiting,
      averageWait: avgWaitTime,
      countersActive: `${activeCounters} / ${totalCounters}`,
      queueHealth,
    };

    // 2. Current Service Activity
    const nowServing = await this.prisma.queueEntry.findMany({
      where: { queue: { businessId }, status: { in: ['CALLED', 'SERVING'] } },
      select: { tokenNumber: true, queue: { select: { tokenPrefix: true, name: true } }, assignedCounterId: true },
      take: 5
    });

    const nextUp = await this.prisma.queueEntry.findMany({
      where: { queue: { businessId }, status: 'WAITING' },
      orderBy: [{ priority: 'desc' }, { joinedAt: 'asc' }],
      select: { tokenNumber: true, queue: { select: { tokenPrefix: true } } },
      take: 5
    });

    // 3. Chart Data (Real data: Tickets issued in the last 2 hours)
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    const recentEntries = await this.prisma.queueEntry.findMany({
      where: { 
        queue: { businessId },
        joinedAt: { gte: twoHoursAgo }
      },
      select: { joinedAt: true }
    });

    // Group into 7 buckets (every 20 mins to cover full 120 mins)
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    recentEntries.forEach(entry => {
      const diffMs = now.getTime() - new Date(entry.joinedAt).getTime();
      const bucketIdx = 6 - Math.floor(diffMs / (20 * 60 * 1000));
      if (bucketIdx >= 0 && bucketIdx <= 6) {
        buckets[bucketIdx]++;
      }
    });

    const chartData = buckets.map((count, i) => {
      const time = new Date(now.getTime() - (6 - i) * 20 * 60000);
      return {
        time: time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        waiting: count
      };
    });

    const responseData = {
      business: {
        id: business.id,
        name: business.name,
        address: business.address,
        googleMapsUrl: business.googleMapsUrl,
        isOpen: business.isOpen,
        latitude: business.latitude,
        longitude: business.longitude,
        geofenceRadius: business.geofenceRadius
      },
      services: servicesWithWaitTimes,
      intelligence,
      currentActivity: {
        nowServing,
        nextUp,
      },
      chartData
    };

    // REDIS CACHE: Save to cache with 10 seconds TTL
    if (this.redisService?.getClient()) {
      try {
        await this.redisService.set(cacheKey, JSON.stringify(responseData), 10);
      } catch (e) {
        console.error("Redis Cache Write Error", e);
      }
    }

    return responseData;
  }

  async getDashboardStats(businessId) {
    // Quick overview stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalServed, currentWaiting, activeCounters, totalCounters, openQueues] = await Promise.all([
      this.prisma.queueEntry.count({
        where: {
          queue: { businessId },
          status: 'COMPLETED',
          joinedAt: { gte: today }
        }
      }),
      this.prisma.queueEntry.count({
        where: {
          queue: { businessId },
          status: 'WAITING'
        }
      }),
      this.prisma.counter.count({
        where: { businessId, status: { not: 'OFFLINE' } }
      }),
      this.prisma.counter.count({
        where: { businessId }
      }),
      this.prisma.queue.count({
        where: { businessId, status: 'OPEN' }
      })
    ]);

    // Dummy avg wait time calculation for UI purposes
    const avgWaitTime = currentWaiting * 4; 

    return { 
      totalServedToday: totalServed, 
      currentWaiting, 
      activeCounters, 
      totalCounters,
      openQueues,
      avgWaitTime
    };
  }

  async getLiveOperations(businessId) {
    // Used for the live ops dashboard view
    let [queues, counters, nextUp, nowServing] = await Promise.all([
      this.prisma.queue.findMany({
        where: { businessId },
        include: {
          service: true,
          entries: {
            where: { status: 'WAITING' },
            orderBy: [
              { priority: 'desc' },
              { joinedAt: 'asc' }
            ],
            include: { user: { select: { name: true } } }
          }
        }
      }),
      this.prisma.counter.findMany({
        where: { businessId }
      }),
      this.prisma.queueEntry.findMany({
        where: {
          queue: { businessId },
          status: 'WAITING'
        },
        orderBy: [
          { priority: 'desc' },
          { joinedAt: 'asc' }
        ],
        include: { queue: { include: { service: true } }, user: { select: { name: true } } }
      }),
      this.prisma.queueEntry.findMany({
        where: {
          queue: { businessId },
          status: { in: ['CALLED', 'SERVING'] }
        },
        include: { queue: { include: { service: true } }, user: { select: { name: true, email: true } } }
      })
    ]);

    // Removed masking so staff can see full details of waiting customers
    nextUp = nextUp.map(entry => entry);
    
    queues = queues.map(queue => ({
      ...queue,
      entries: queue.entries
    }));

    // Generate dummy counter performance stats for UI
    const counterPerformance = counters.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      avgTime: c.status === 'OFFLINE' ? null : (Math.random() * 5 + 3).toFixed(1) // e.g. 5.2m
    }));

    return { queues, counters, nextUp, nowServing, counterPerformance };
  }
}

