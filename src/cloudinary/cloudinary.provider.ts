import { ConfigService } from '@nestjs/config';
import { v2 } from 'cloudinary';

export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => {
    return v2.config({
      cloud_name: cfg.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: cfg.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: cfg.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
  },
};
