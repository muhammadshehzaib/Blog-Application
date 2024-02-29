import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [process.env.LOCALHOST, process.env.DEPLOYMENTLINK],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  if (process.env.NODE_ENV === 'production') {
    app.enableCors({
      origin: [process.env.DEPLOYMENTLINK],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      allowedHeaders:
        'Origin,X-Requested-With,Content-Type,Accept,Authorization',
      exposedHeaders: 'Location',
    });
  } else {
    app.enableCors({
      origin: [process.env.LOCALHOST],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
      allowedHeaders:
        'Origin,X-Requested-With,Content-Type,Accept,Authorization',
      exposedHeaders: 'Location',
    });
  }

  await app.listen(3002);
}
bootstrap();
