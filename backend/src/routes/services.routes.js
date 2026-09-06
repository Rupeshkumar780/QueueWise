import { Controller, Post, Get, Body, Param, UseGuards, Dependencies, Bind } from '@nestjs/common';
import { ServicesService } from '../services/services.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('v1/services')
@Dependencies(ServicesService)
export class ServicesController {
  constructor(servicesService) {
    this.servicesService = servicesService;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN')
  @Post(':businessId')
  @Bind(Param('businessId'), Body())
  create(businessId, data) {
    return this.servicesService.create(businessId, data);
  }

  @Get('business/:businessId')
  @Bind(Param('businessId'))
  findAll(businessId) {
    return this.servicesService.findAllByBusiness(businessId);
  }

  @Get(':id')
  @Bind(Param('id'))
  findOne(id) {
    return this.servicesService.findOne(id);
  }
}
