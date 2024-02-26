import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { BlogSchema } from './schemas/blogs.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Cloudinary } from 'cloudinary-core';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CategorySchema } from '../category/schemas/category.schema';
@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Blog', schema: BlogSchema }]),
    MongooseModule.forFeature([
      { name: 'BlogsCategories', schema: CategorySchema },
    ]),

    CloudinaryModule,
  ],

  providers: [BlogsService, JwtService, Cloudinary, CloudinaryService],
  controllers: [BlogsController],
})
export class BlogsModule {}
