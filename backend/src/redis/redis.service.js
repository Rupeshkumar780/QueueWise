import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

// Helper for fast-fail timeout
const withTimeout = (promise, ms, fallbackValue = null) => {
  let timer;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => {
      resolve(fallbackValue);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

@Injectable()
export class RedisService {
  constructor() {
    this.logger = new Logger(RedisService.name);
    try {
      this.client = Redis.fromEnv();
      this.logger.log('Upstash Redis initialized from env');
    } catch (error) {
      this.logger.error('Failed to initialize Upstash Redis.', error);
    }
  }

  getClient() {
    return this.client;
  }

  async get(key) {
    if (!this.client) return null;
    try {
      // 300ms strict timeout for reads to prevent page hang
      const result = await withTimeout(this.client.get(key), 300, null);
      if (result === null) this.logger.warn(`Redis GET timeout or null for ${key}`);
      return result;
    } catch (e) {
      this.logger.warn(`Redis GET error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.client) return null;
    try {
      // Fire and forget sets with a small timeout so it doesn't block the backend flow
      const setPromise = ttlSeconds 
        ? this.client.set(key, value, { ex: ttlSeconds }) 
        : this.client.set(key, value);
      return await withTimeout(setPromise, 500, null);
    } catch (e) {
      this.logger.warn(`Redis SET error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async del(key) {
    if (!this.client) return null;
    try {
      return await withTimeout(this.client.del(key), 500, null);
    } catch (e) {
      this.logger.warn(`Redis DEL error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async incr(key) {
    if (!this.client) return null;
    // INCR is critical, give it 1 second timeout
    const result = await withTimeout(this.client.incr(key), 1000, null);
    if (result === null) throw new Error("Redis INCR timed out. Falling back to DB.");
    return result;
  }
}
