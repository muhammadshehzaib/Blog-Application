import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap();
