import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimiterMiddleware {
  constructor(redisService) {
    this.redisService = redisService;
  }

  async use(req, res, next) {
    if (!this.redisService.getClient()) {
      return next(); // Bypass if Redis is not configured
    }

    const ip = req.ip || req.connection.remoteAddress;
    const key = `ratelimit:${ip}`;
    
    // Simple fixed window rate limit: Max 20 requests per IP per minute
    // Usually you'd only apply this to specific routes like POST /join, but this is a global example
    try {
      const current = await this.redisService.incr(key);
      
      if (current === 1) {
        // Set expiry of 60 seconds on the first request
        await this.redisService.getClient().expire(key, 60);
      }

      if (current > 50) { // 50 requests per minute limit
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      next();
    } catch (e) {
      if (e instanceof HttpException) throw e;
      // Fallback
      next();
    }
  }
}

