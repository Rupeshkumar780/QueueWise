import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class ServicesService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(businessId, data) {
    return this.prisma.service.create({
      data: {
        ...data,
        businessId,
      },
    });
  }

  async findAllByBusiness(businessId) {
    return this.prisma.service.findMany({
      where: { businessId },
      include: { formTemplate: true }
    });
  }
}
