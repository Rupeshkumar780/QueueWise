import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { EventEmitter } from 'events';

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
    this.eventEmitter = new EventEmitter();
    this.metrics = { hits: 0, misses: 0, errors: 0 };
    
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

  getMetrics() {
    return this.metrics;
  }

  async get(key) {
    if (!this.client) {
      this.metrics.errors++;
      return null;
    }
    try {
      const result = await withTimeout(this.client.get(key), 50, null);
      if (result === null) {
        this.metrics.misses++;
      } else {
        this.metrics.hits++;
      }
      return result;
    } catch (e) {
      this.metrics.errors++;
      this.logger.warn(`Redis GET error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    if (!this.client) return null;
    try {
      const setPromise = ttlSeconds 
        ? this.client.set(key, value, { ex: ttlSeconds }) 
        : this.client.set(key, value);
      return await withTimeout(setPromise, 100, null);
    } catch (e) {
      this.logger.warn(`Redis SET error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async del(key) {
    if (!this.client) return null;
    try {
      return await withTimeout(this.client.del(key), 100, null);
    } catch (e) {
      this.logger.warn(`Redis DEL error for key ${key}: ${e.message}`);
      return null;
    }
  }

  async incr(key) {
    if (!this.client) return null;
    const result = await withTimeout(this.client.incr(key), 1000, null);
    if (result === null) throw new Error("Redis INCR timed out. Falling back to DB.");
    return result;
  }

  async publish(channel, message) {
    // Single-node decoupling via internal EventEmitter
    // This maintains the pub/sub architecture locally without requiring native Redis subscriptions.
    try {
      const payload = typeof message === 'string' ? JSON.parse(message) : message;
      this.eventEmitter.emit(channel, payload);
    } catch (e) {
      this.logger.warn(`Local PUBLISH error: ${e.message}`);
    }
  }

  subscribe(channel, callback) {
    // Single-node decoupling via internal EventEmitter
    this.eventEmitter.on(channel, callback);
  }
}
