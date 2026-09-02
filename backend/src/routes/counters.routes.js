import { Controller, Get, Post, Body, Param, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { CountersService } from '../counters/counters.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/counters')
@Dependencies(CountersService)
export class CountersController {
  constructor(countersService) {
    this.countersService = countersService;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN')
  @Post(':businessId')
  @Bind(Param('businessId'), Body())
  create(businessId, data) {
    return this.countersService.create(businessId, data);
  }

  @Get('business/:businessId')
  @Bind(Param('businessId'))
  findAll(businessId) {
    return this.countersService.findAllByBusiness(businessId);
  }

  @Post(':id/status')
  @Bind(Param('id'), Body())
  updateStatus(id, body) {
    return this.countersService.updateStatus(id, body.status);
  }
}
