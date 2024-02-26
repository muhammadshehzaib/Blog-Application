import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogsModule } from '../blogs/blogs.module';
import { BlogsService } from '../blogs/blogs.service';
import { BlogSchema } from '../blogs/schemas/blogs.schema';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsSchema } from './schemas/comments.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Cloudinary } from 'cloudinary-core';
import { CategorySchema } from '../category/schemas/category.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Comments', schema: CommentsSchema }]),
    MongooseModule.forFeature([
      { name: 'BlogsCategories', schema: CategorySchema },
    ]),
    MongooseModule.forFeature([{ name: 'Blog', schema: BlogSchema }]),
    BlogsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, BlogsService, Cloudinary, CloudinaryService],
})
export class CommentsModule {}
