import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { Cloudinary } from './cloudinary';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  providers: [CloudinaryService, Cloudinary, CloudinaryProvider],
  controllers: [CloudinaryController],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
