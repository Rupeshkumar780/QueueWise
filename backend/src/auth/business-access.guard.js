import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Dependencies } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
@Dependencies(PrismaService)
export class BusinessAccessGuard {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async canActivate(context) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false; // Authentication should be handled by AuthGuard
    }

    const params = request.params;
    const body = request.body;
    
    let targetBusinessId = null;

    if (params.businessId) {
      targetBusinessId = params.businessId;
    } else if (params.id) {
      const urlPath = request.url || '';
      if (urlPath.includes('/businesses/')) {
        targetBusinessId = params.id;
      } else if (urlPath.includes('/queues/')) {
        const queue = await this.prisma.queue.findUnique({ where: { id: params.id } });
        if (queue) targetBusinessId = queue.businessId;
      } else if (urlPath.includes('/counters/')) {
        const counter = await this.prisma.counter.findUnique({ where: { id: params.id } });
        if (counter) targetBusinessId = counter.businessId;
      } else if (urlPath.includes('/services/')) {
        const service = await this.prisma.service.findUnique({ where: { id: params.id } });
        if (service) targetBusinessId = service.businessId;
      } else if (urlPath.includes('/queue-entries/')) {
        const entry = await this.prisma.queueEntry.findUnique({
          where: { id: params.id },
          include: { queue: true }
        });
        if (entry && entry.queue) targetBusinessId = entry.queue.businessId;
      }
    }

    if (!targetBusinessId && body && body.businessId) {
      targetBusinessId = body.businessId;
    }

    if (!targetBusinessId) {
      if (request.method === 'POST' && request.route.path === '/v1/businesses') {
        return true;
      }
      return true;
    }

    const business = await this.prisma.business.findUnique({
      where: { id: targetBusinessId },
      include: {
        staff: { select: { id: true } }
      }
    });

    if (!business) {
      throw new ForbiddenException('Business not found');
    }

    const isOwner = business.ownerId === user.id;
    const isStaff = business.staff.some(staffMember => staffMember.id === user.id);

    if (!isOwner && !isStaff) {
      throw new ForbiddenException('You do not have access to this business.');
    }

    return true;
  }
}
