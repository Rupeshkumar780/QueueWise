import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
@Dependencies(PrismaService, EventsGateway)
export class CountersService {
  constructor(prisma, eventsGateway) {
    this.prisma = prisma;
    this.eventsGateway = eventsGateway;
  }

  async create(businessId, data) {
    const counter = await this.prisma.counter.create({
      data: {
        ...data,
        businessId,
        status: data.status || 'AVAILABLE',
      },
    });
    this.eventsGateway.broadcastQueueUpdate(null, businessId);
    return counter;
  }

  async findAllByBusiness(businessId) {
    return this.prisma.counter.findMany({ where: { businessId } });
  }

  async updateStatus(id, status) {
    const counter = await this.prisma.counter.update({
      where: { id },
      data: { status }
    });

    // Determine if we need to update the attached Queue
    if (counter.supportedServices && counter.supportedServices.length > 0) {
      const serviceId = counter.supportedServices[0];
      
      // Get all counters for this service
      const allCounters = await this.prisma.counter.findMany({
        where: {
          businessId: counter.businessId,
          supportedServices: { has: serviceId }
        }
      });

      let queueStatus = 'CLOSED';
      const hasAvailable = allCounters.some(c => c.status === 'AVAILABLE');
      const hasBusy = allCounters.some(c => c.status === 'BUSY');

      if (hasAvailable) {
        queueStatus = 'OPEN';
      } else if (hasBusy) {
        queueStatus = 'PAUSED';
      } else {
        queueStatus = 'CLOSED';
      }

      // Update the Queue Status
      await this.prisma.queue.updateMany({
        where: { serviceId },
        data: { status: queueStatus }
      });
      
      // Get the queue to broadcast its ID
      const queue = await this.prisma.queue.findFirst({ where: { serviceId } });
      if (queue) {
        this.eventsGateway.broadcastQueueUpdate(queue.id, counter.businessId);
        return counter;
      }
    }

    this.eventsGateway.broadcastQueueUpdate(null, counter.businessId);
    return counter;
  }

  async delete(id) {
    const counter = await this.prisma.counter.findUnique({ where: { id } });
    if (!counter) return;

    const businessId = counter.businessId;

    if (counter.supportedServices && counter.supportedServices.length > 0) {
      const serviceId = counter.supportedServices[0];
      
      // Delete the counter first
      await this.prisma.counter.delete({ where: { id } });
      
      // Check if any other counters are still using this service
      const remainingCounters = await this.prisma.counter.count({
        where: {
          businessId,
          supportedServices: { has: serviceId }
        }
      });
      
      // Only delete the service if no other counters are using it
      if (remainingCounters === 0) {
        try {
          await this.prisma.service.delete({ where: { id: serviceId } });
        } catch (e) {
          console.error('Service may have been deleted or has remaining references:', e);
        }
      } else {
        // Recalculate queue status based on remaining counters
        const allRemaining = await this.prisma.counter.findMany({
          where: { businessId, supportedServices: { has: serviceId } }
        });
        
        let queueStatus = 'CLOSED';
        if (allRemaining.some(c => c.status === 'AVAILABLE')) queueStatus = 'OPEN';
        else if (allRemaining.some(c => c.status === 'BUSY')) queueStatus = 'PAUSED';
        
        await this.prisma.queue.updateMany({
          where: { serviceId },
          data: { status: queueStatus }
        });
        
        const queue = await this.prisma.queue.findFirst({ where: { serviceId } });
        if (queue) {
          this.eventsGateway.broadcastQueueUpdate(queue.id, businessId);
          return { success: true };
        }
      }
    } else {
      await this.prisma.counter.delete({ where: { id } });
    }
    
    this.eventsGateway.broadcastQueueUpdate(null, businessId);
    return { success: true };
  }
}
