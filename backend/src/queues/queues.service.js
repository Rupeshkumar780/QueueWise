import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
@Dependencies(PrismaService, EventsGateway)
export class QueuesService {
  constructor(prisma, eventsGateway) {
    this.prisma = prisma;
    this.eventsGateway = eventsGateway;
  }

  async create(data) {
    return this.prisma.queue.create({ data });
  }

  async findAllByBusiness(businessId) {
    return this.prisma.queue.findMany({
      where: { businessId },
      include: { service: true }
    });
  }

  async findOne(id) {
    const queue = await this.prisma.queue.findUnique({ where: { id } });
    if (!queue) throw new NotFoundException('Queue not found');
    return queue;
  }

  async updateStatus(id, status) {
    const queue = await this.prisma.queue.update({
      where: { id },
      data: { status },
    });
    this.eventsGateway.broadcastQueueUpdate(queue.id, queue.businessId);
    return queue;
  }

  async updateConfig(id, data) {
    const queue = await this.prisma.queue.update({
      where: { id },
      data,
    });
    this.eventsGateway.broadcastQueueUpdate(queue.id, queue.businessId);
    return queue;
  }
}

