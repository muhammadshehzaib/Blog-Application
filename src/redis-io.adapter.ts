import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(app: INestApplicationContext) {
    super(app);
  }

  async connectToRedis(redisUrl: string): Promise<void> {
    const pubClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });
    const subClient = pubClient.duplicate({
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
    });

    pubClient.on('error', () => {});
    subClient.on('error', () => {});

    const readyPromise = Promise.all([
      new Promise<void>((resolve) => pubClient.once('ready', () => resolve())),
      new Promise<void>((resolve) => subClient.once('ready', () => resolve())),
    ]);

    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Redis connection timed out')), 2000)
    );

    try {
      await Promise.race([readyPromise, timeoutPromise]);
      this.adapterConstructor = createAdapter(pubClient, subClient);
    } catch (err) {
      pubClient.disconnect();
      subClient.disconnect();
      throw err;
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
