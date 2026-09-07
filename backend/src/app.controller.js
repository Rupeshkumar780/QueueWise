import { Controller, Dependencies, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
@Dependencies(AppService, PrismaService)
export class AppController {
  constructor(appService, prisma) {
    this.appService = appService;
    this.prisma = prisma;
  }

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get(['health', 'v1/health'])
  async getHealth() {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
