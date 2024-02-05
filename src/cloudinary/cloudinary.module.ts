import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { Cloudinary } from './cloudinary';

@Module({
  providers: [CloudinaryService, Cloudinary],
  controllers: [CloudinaryController]
})
export class CloudinaryModule {}
