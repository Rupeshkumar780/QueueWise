import { Controller, Post, Get, Body, Param, UseGuards, Request, Dependencies, Bind } from '@nestjs/common';
import { QueueEntriesService } from '../queue-entries/queue-entries.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BusinessAccessGuard } from '../auth/business-access.guard';

@Controller('v1/queue-entries')
@Dependencies(QueueEntriesService)
export class QueueEntriesController {
  constructor(queueEntriesService) {
    this.queueEntriesService = queueEntriesService;
  }

  @Post(':queueId/join')
  @UseGuards(AuthGuard('jwt'))
  @Bind(Param('queueId'), Body(), Request())
  joinQueue(queueId, body, req) {
    const userId = req.user?.id || null;
    return this.queueEntriesService.joinQueue(queueId, userId, body.locationData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-tickets')
  @Bind(Request())
  async getMyTickets(req) {
    const userId = req.user?.id;
    return this.queueEntriesService.getUserTickets(userId);
  }

  @Get(':id')
  @Bind(Param('id'), Request())
  getEntryById(id, req) {
    const userId = req.user?.id || null;
    return this.queueEntriesService.getEntryById(id, userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Get('business/:businessId')
  @Bind(Param('businessId'))
  getBusinessEntries(businessId) {
    return this.queueEntriesService.getBusinessEntries(businessId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/cancel')
  @Bind(Param('id'), Request())
  cancelEntry(id, req) {
    return this.queueEntriesService.cancelEntry(id, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Post(':id/admin-cancel')
  @Bind(Param('id'), Request())
  adminCancelEntry(id, req) {
    return this.queueEntriesService.cancelEntry(id, 'ADMIN');
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('STAFF', 'BUSINESS_ADMIN')
  @Post('queue/:queueId/call-next')
  @Bind(Param('queueId'), Body())
  callNext(queueId, body) {
    return this.queueEntriesService.callNext(queueId, body.counterId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('STAFF', 'BUSINESS_ADMIN')
  @Post(':id/complete')
  @Bind(Param('id'), Body())
  completeService(id, body) {
    return this.queueEntriesService.completeService(id, body.counterId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('STAFF', 'BUSINESS_ADMIN')
  @Post(':id/no-show')
  @Bind(Param('id'), Body())
  markNoShow(id, body) {
    return this.queueEntriesService.markNoShow(id, body.counterId);
  }
}
