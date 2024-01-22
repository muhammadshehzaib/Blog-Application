import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogsService } from './blogs/blogs.service';
import { BlogsModule } from './blogs/blogs.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[ConfigModule.forRoot({
    envFilePath:'.env',
    isGlobal:true,
  }),
  MongooseModule.forRoot(process.env.DBURI),
  BlogsModule, 
  AuthModule,
],
  
  controllers: [AppController],
  providers: [AppService, BlogsService],
})
export class AppModule {}
