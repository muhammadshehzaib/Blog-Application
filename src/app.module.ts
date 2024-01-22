import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BlogsService } from './blogs/blogs.service';
import { BlogsModule } from './blogs/blogs.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BlogsController } from './blogs/blogs.controller';

@Module({
  imports:[ConfigModule.forRoot({
    envFilePath:'.env',
    isGlobal:true,
  }),
  BlogsModule, 
  MongooseModule.forRoot(process.env.DBURI),
  AuthModule,
],
  
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
