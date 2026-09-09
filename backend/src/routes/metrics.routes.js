import { Controller, Get, Dependencies } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('v1/metrics')
@Dependencies(RedisService)
export class MetricsController {
  constructor(redisService) {
    this.redisService = redisService;
  }

  @Get('redis')
  getRedisMetrics() {
    return this.redisService.getMetrics();
  }
}
