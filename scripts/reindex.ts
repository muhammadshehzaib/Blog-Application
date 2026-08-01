import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BlogsService } from '../src/blogs/blogs.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Bootstrapping NestJS application context...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const blogsService = app.get(BlogsService);

  console.log('Starting reindexing process...');
  const stats = await blogsService.reindexAll((done, total) => {
    console.log(`Progress: ${done}/${total}`);
  });

  console.log('Reindexing finished. Stats:', stats);
  await app.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error during reindexing:', err);
  process.exit(1);
});
