import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Dependencies, Bind } from '@nestjs/common';
import { BusinessesService } from '../businesses/businesses.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BusinessAccessGuard } from '../auth/business-access.guard';

@Controller('v1/businesses')
@Dependencies(BusinessesService)
export class BusinessesController {
  constructor(businessesService) {
    this.businessesService = businessesService;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('BUSINESS_ADMIN')
  @Post()
  @Bind(Body(), Request())
  create(data, req) {
    return this.businessesService.create(data, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  @Bind(Request())
  findMine(req) {
    return this.businessesService.findMine(req.user.id);
  }

  @Get()
  @Bind(Query('city'), Query('search'))
  findAll(city, search) {
    return this.businessesService.findAll(city, search);
  }

  @Get(':id')
  @Bind(Param('id'))
  findOne(id) {
    return this.businessesService.findOne(id);
  }
  
  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN')
  @Post(':id/update')
  @Bind(Param('id'), Body())
  update(id, data) {
    return this.businessesService.update(id, data);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN')
  @Post(':id/staff')
  @Bind(Param('id'), Body())
  addStaff(id, data) {
    return this.businessesService.addStaff(id, data);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN')
  @Post(':id/staff/:userId/remove')
  @Bind(Param('id'), Param('userId'))
  removeStaff(id, userId) {
    return this.businessesService.removeStaff(id, userId);
  }

  @Get(':id/customer-landing')
  @Bind(Param('id'))
  getCustomerLanding(id) {
    return this.businessesService.getCustomerLandingData(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Get(':id/analytics')
  @Bind(Param('id'))
  getAnalytics(id) {
    return this.businessesService.getAnalytics(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Get(':id/dashboard-stats')
  @Bind(Param('id'))
  getDashboardStats(id) {
    return this.businessesService.getDashboardStats(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard, BusinessAccessGuard)
  @Roles('BUSINESS_ADMIN', 'STAFF')
  @Get(':id/live-operations')
  @Bind(Param('id'))
  getLiveOperations(id) {
    return this.businessesService.getLiveOperations(id);
  }
}
