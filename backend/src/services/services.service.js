import { Injectable, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class ServicesService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async create(businessId, data) {
    const { formTemplate, ...serviceData } = data;
    const createData = {
      ...serviceData,
      businessId,
    };

    if (formTemplate && Array.isArray(formTemplate) && formTemplate.length > 0) {
      createData.formTemplate = {
        create: {
          schema: formTemplate
        }
      };
    }

    return this.prisma.service.create({
      data: createData,
    });
  }

  async findAllByBusiness(businessId) {
    return this.prisma.service.findMany({
      where: { businessId },
      include: { formTemplate: true }
    });
  }

  async findOne(id) {
    return this.prisma.service.findUnique({
      where: { id },
      include: { 
        formTemplate: true,
        queues: true // Need this to find active queue for the service
      }
    });
  }
}
