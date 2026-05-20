import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  private client: Redis;

  constructor() {
    super();
    this.client = new Redis(
      process.env.REDIS_URL ?? 'redis://localhost:6379',
      { lazyConnect: true, maxRetriesPerRequest: 1 },
    );
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      if (this.client.status === 'end' || this.client.status === 'wait') {
        await this.client.connect();
      }
      const pong = await this.client.ping();
      const healthy = pong === 'PONG';
      const result = this.getStatus(key, healthy, { ping: pong });
      if (healthy) return result;
      throw new HealthCheckError('Redis ping failed', result);
    } catch (err) {
      throw new HealthCheckError(
        'Redis check failed',
        this.getStatus(key, false, { error: (err as Error).message }),
      );
    }
  }
}
