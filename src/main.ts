import './tracing';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? [process.env.DEPLOYMENTLINK]
      : [process.env.LOCALHOST, process.env.DEPLOYMENTLINK];

  app.enableCors({
    origin: allowedOrigins.filter(Boolean),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders:
      'Origin,X-Requested-With,Content-Type,Accept,Authorization',
    exposedHeaders: 'Location',
  });

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const redisAdapter = new RedisIoAdapter(app);
  try {
    await redisAdapter.connectToRedis(redisUrl);
    app.useWebSocketAdapter(redisAdapter);
    console.log('Redis WebSocket adapter configured successfully.');
  } catch (err) {
    console.warn(
      `Could not connect to Redis: ${(err as Error).message}. Falling back to default WebSocket adapter.`,
    );
  }

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
