import { Controller, Post, Get, Body, Param, UseGuards, Request, Dependencies, Bind } from '@nestjs/common';
import { QueueEntriesService } from '../queue-entries/queue-entries.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/queue-entries')
@Dependencies(QueueEntriesService)
export class QueueEntriesController {
  constructor(queueEntriesService) {
    this.queueEntriesService = queueEntriesService;
  }

  @Post(':queueId/join')
  @Bind(Param('queueId'), Body(), Request())
  joinQueue(queueId, body, req) {
    // userId is optional. If they have a token, we could extract it, but for now we pass null for anonymous.
    const userId = req.user?.id || null;
    return this.queueEntriesService.joinQueue(queueId, userId, body.locationData);
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('my-status')
  @Bind(Request())
  async getMyStatus(req) {
    // Retrieve all active queue entries for the logged-in user
    // FOR TESTING: We return the entries for the first waiting customer
    return this.queueEntriesService.getTestActiveEntries();
  }

  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post(':id/cancel')
  @Bind(Param('id'), Request())
  cancelEntry(id, req) {
    return this.queueEntriesService.cancelEntry(id, null);
  }

  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('STAFF', 'BUSINESS_ADMIN')
  @Post('queue/:queueId/call-next')
  @Bind(Param('queueId'), Body())
  callNext(queueId, body) {
    return this.queueEntriesService.callNext(queueId, body.counterId);
  }

  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('STAFF', 'BUSINESS_ADMIN')
  @Post(':id/complete')
  @Bind(Param('id'), Body())
  completeService(id, body) {
    return this.queueEntriesService.completeService(id, body.counterId);
  }

  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('STAFF', 'BUSINESS_ADMIN')
  @Post(':id/no-show')
  @Bind(Param('id'), Body())
  markNoShow(id, body) {
    return this.queueEntriesService.markNoShow(id, body.counterId);
  }
}
