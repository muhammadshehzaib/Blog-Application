import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsController } from './blogs.controller';
import { BlogSchema } from './schemas/blogs.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports:[MongooseModule.forFeature([{name:'Blog',schema:BlogSchema}])],
  providers: [BlogsService],
  controllers: [BlogsController]
})
export class BlogsModule {}
