import { Controller, Get, Post, Patch, Body, Param, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { QueuesService } from '../queues/queues.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/queues')
@Dependencies(QueuesService)
export class QueuesController {
  constructor(queuesService) {
    this.queuesService = queuesService;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN')
  @Post()
  @Bind(Body())
  create(data) {
    return this.queuesService.create(data);
  }

  @Get('business/:businessId')
  @Bind(Param('businessId'))
  findAll(businessId) {
    return this.queuesService.findAllByBusiness(businessId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Patch(':id')
  @Bind(Param('id'), Body())
  updateConfig(id, data) {
    return this.queuesService.updateConfig(id, data);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Post(':id/open')
  @Bind(Param('id'))
  open(id) {
    return this.queuesService.updateStatus(id, 'OPEN');
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Post(':id/pause')
  @Bind(Param('id'))
  pause(id) {
    return this.queuesService.updateStatus(id, 'PAUSED');
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN')
  @Post(':id/close')
  @Bind(Param('id'))
  close(id) {
    return this.queuesService.updateStatus(id, 'CLOSED');
  }
}
