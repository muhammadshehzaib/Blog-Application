import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { BlogSchema } from './schemas/blogs.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CategorySchema } from '../category/schemas/category.schema';
import { ReindexProcessor, REINDEX_QUEUE } from './reindex.processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Blog', schema: BlogSchema }]),
    MongooseModule.forFeature([
      { name: 'BlogsCategories', schema: CategorySchema },
    ]),
    CloudinaryModule,
    BullModule.registerQueue({ name: REINDEX_QUEUE }),
  ],
  providers: [BlogsService, ReindexProcessor],
  controllers: [BlogsController],
})
export class BlogsModule {}
