import { Controller, Get, Post, Delete, Body, Param, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { CountersService } from '../counters/counters.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BusinessAccessGuard } from '../auth/business-access.guard';

@Controller('v1/counters')
@Dependencies(CountersService)
export class CountersController {
  constructor(countersService) {
    this.countersService = countersService;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
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

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Post(':id/status')
  @Bind(Param('id'), Body())
  updateStatus(id, body) {
    return this.countersService.updateStatus(id, body.status);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Delete(':id')
  @Bind(Param('id'))
  deleteCounter(id) {
    return this.countersService.delete(id);
  }
}
