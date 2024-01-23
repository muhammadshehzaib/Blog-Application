import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogsService } from './blogs/blogs.service';
import { BlogsModule } from './blogs/blogs.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BlogsController } from './blogs/blogs.controller';
import { CategoryController } from './category/category.controller';
import { CategoryService } from './category/category.service';
import { CategoryModule } from './category/category.module';

@Module({
  imports:[ConfigModule.forRoot({
    envFilePath:'.env',
    isGlobal:true,
  }),
  BlogsModule, 
  CategoryModule,
  MongooseModule.forRoot(process.env.DBURI),
  AuthModule,
],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
