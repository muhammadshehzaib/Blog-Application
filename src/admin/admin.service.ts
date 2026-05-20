import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Counter } from 'prom-client';
import {
  COMMENTS_CREATED,
  REACTIONS_CHANGED,
} from '../metrics/metrics.module';

export interface DashboardSnapshot {
  health: {
    mongodb: 'up' | 'down';
    redis: 'up' | 'down';
  };
  process: {
    uptimeSeconds: number;
    nodeVersion: string;
    memoryMB: {
      heapUsed: number;
      heapTotal: number;
      rss: number;
    };
  };
  metrics: {
    commentsCreated: number;
    reactionsChanged: { create: number; update: number; delete: number };
  };
  mailQueue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
}

@Injectable()
export class AdminService {
  private redisClient: Redis;

  constructor(
    @InjectConnection() private mongoConnection: Connection,
    @InjectQueue('mail') private mailQueue: Queue,
    @InjectMetric(COMMENTS_CREATED) private commentsCreated: Counter<string>,
    @InjectMetric(REACTIONS_CHANGED) private reactionsChanged: Counter<string>,
  ) {
    this.redisClient = new Redis(
      process.env.REDIS_URL ?? 'redis://localhost:6379',
      { lazyConnect: true, maxRetriesPerRequest: 1 },
    );
  }

  async snapshot(): Promise<DashboardSnapshot> {
    const [mongoStatus, redisStatus, jobCounts] = await Promise.all([
      this.checkMongo(),
      this.checkRedis(),
      this.mailQueue.getJobCounts(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
      ),
    ]);

    const commentsVal = await this.readCounter(this.commentsCreated);
    const reactionsByAction = await this.readLabeledCounter(
      this.reactionsChanged,
      'action',
    );

    const mem = process.memoryUsage();

    return {
      health: { mongodb: mongoStatus, redis: redisStatus },
      process: {
        uptimeSeconds: Math.round(process.uptime()),
        nodeVersion: process.version,
        memoryMB: {
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
          heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
          rss: Math.round(mem.rss / 1024 / 1024),
        },
      },
      metrics: {
        commentsCreated: commentsVal,
        reactionsChanged: {
          create: reactionsByAction.create ?? 0,
          update: reactionsByAction.update ?? 0,
          delete: reactionsByAction.delete ?? 0,
        },
      },
      mailQueue: {
        waiting: jobCounts.waiting ?? 0,
        active: jobCounts.active ?? 0,
        completed: jobCounts.completed ?? 0,
        failed: jobCounts.failed ?? 0,
        delayed: jobCounts.delayed ?? 0,
      },
    };
  }

  private async checkMongo(): Promise<'up' | 'down'> {
    try {
      return this.mongoConnection.readyState === 1 ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  private async checkRedis(): Promise<'up' | 'down'> {
    try {
      if (
        this.redisClient.status === 'end' ||
        this.redisClient.status === 'wait'
      ) {
        await this.redisClient.connect();
      }
      const pong = await this.redisClient.ping();
      return pong === 'PONG' ? 'up' : 'down';
    } catch {
      return 'down';
    }
  }

  private async readCounter(counter: Counter<string>): Promise<number> {
    const data = await counter.get();
    return data.values?.[0]?.value ?? 0;
  }

  private async readLabeledCounter(
    counter: Counter<string>,
    label: string,
  ): Promise<Record<string, number>> {
    const data = await counter.get();
    const out: Record<string, number> = {};
    for (const v of data.values ?? []) {
      const key = (v.labels as Record<string, string>)[label];
      if (key) out[key] = v.value;
    }
    return out;
  }
}
