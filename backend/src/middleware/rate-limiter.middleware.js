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
    try {
      const current = await this.redisService.incr(key);
      
      if (current === null) {
        return next(); // Redis unavailable, skip rate limiting
      }

      // Set expiry on first request (key didn't exist before incr)
      if (current === 1) {
        await this.redisService.set(key, '1', 60);
      }

      if (current > 20) {
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      next();
    } catch (e) {
      if (e instanceof HttpException) throw e;
      // Fallback - allow request if Redis errors
      next();
    }
  }
}
