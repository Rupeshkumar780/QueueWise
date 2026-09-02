import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class CountersService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(businessId, data) {
    return this.prisma.counter.create({
      data: {
        ...data,
        businessId,
      },
    });
  }

  async findAllByBusiness(businessId) {
    return this.prisma.counter.findMany({ where: { businessId } });
  }

  async updateStatus(id, status) {
    return this.prisma.counter.update({
      where: { id },
      data: { status }
    });
  }
}

