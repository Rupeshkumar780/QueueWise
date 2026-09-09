import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { EventEmitter } from 'events';

@Injectable()
export class RedisService {
  constructor() {
    this.logger = new Logger(RedisService.name);
    this.metrics = { hits: 0, misses: 0, errors: 0 };
    this.connected = false;
    this.emitter = new EventEmitter();

    const restUrl = process.env.UPSTASH_REDIS_REST_URL;
    const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (restUrl && restToken) {
      try {
        this.client = new Redis({ url: restUrl, token: restToken });
        this.connected = true;
        this.logger.log(`Upstash Redis connected via REST API at ${restUrl}`);
      } catch (error) {
        this.logger.error('Failed to initialize Upstash Redis.', error);
        this.client = null;
        this.connected = false;
      }
    } else {
      this.logger.warn('UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Redis disabled.');
      this.client = null;
      this.connected = false;
    }
  }

  getClient() {
    return this.connected ? this.client : null;
  }

  getMetrics() {
    return {
      ...this.metrics,
      status: this.connected ? 'ready' : 'disabled',
      available: this.connected,
    };
  }

  async get(key) {
    if (!this.connected) {
      this.metrics.errors++;
      return null;
    }
    try {
      const result = await this.client.get(key);
      if (result === null || result === undefined) {
        this.metrics.misses++;
        return null;
      }
      this.metrics.hits++;
      // @upstash/redis auto-deserializes JSON, so return raw
      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (e) {
      this.metrics.errors++;
      this.logger.warn(`Redis GET error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.connected) return null;
    try {
      const opts = ttlSeconds ? { ex: ttlSeconds } : undefined;
      return await this.client.set(key, value, opts);
    } catch (e) {
      this.logger.warn(`Redis SET error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async del(key) {
    if (!this.connected) return null;
    try {
      return await this.client.del(key);
    } catch (e) {
      this.logger.warn(`Redis DEL error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async incr(key) {
    if (!this.connected) return null;
    try {
      return await this.client.incr(key);
    } catch (e) {
      this.logger.warn(`Redis INCR error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async publish(channel, message) {
    // Use local EventEmitter for pub/sub since Upstash REST doesn't support
    // native Redis Pub/Sub subscriptions. For a single-instance app this is fine.
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.emitter.emit(channel, payload);
  }

  subscribe(channel, callback) {
    // Local EventEmitter subscription
    this.emitter.on(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        callback(parsed);
      } catch (e) {
        callback(message);
      }
    });
  }
}
