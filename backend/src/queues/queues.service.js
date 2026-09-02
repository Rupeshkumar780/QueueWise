import { Injectable, Dependencies, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class QueuesService {
  constructor(prisma) {
    this.prisma = prisma;
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
    return this.prisma.queue.update({
      where: { id },
      data: { status },
    });
  }

  async updateConfig(id, data) {
    return this.prisma.queue.update({
      where: { id },
      data,
    });
  }
}

