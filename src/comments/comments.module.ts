import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogsModule } from 'src/blogs/blogs.module';
import { BlogsService } from 'src/blogs/blogs.service';
import { BlogSchema } from 'src/blogs/schemas/blogs.schema';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsSchema } from './schemas/comments.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { Cloudinary } from 'cloudinary-core';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Comments', schema: CommentsSchema }]),
    MongooseModule.forFeature([{ name: 'Blog', schema: BlogSchema }]),
    BlogsModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService, BlogsService, Cloudinary, CloudinaryService],
})
export class CommentsModule {}
