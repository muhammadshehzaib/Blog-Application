import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CategorySchema } from './schemas/category.schema';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports:[MongooseModule.forFeature([{name:'BlogsCategories',schema:CategorySchema}])],

  providers: [CategoryService,JwtService],
  controllers: [CategoryController]
})
export class CategoryModule {}
