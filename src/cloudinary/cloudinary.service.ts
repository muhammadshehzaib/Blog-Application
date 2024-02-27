import { BadRequestException, Injectable } from '@nestjs/common';
import toStream from 'buffer-to-stream';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<any> {
    try {
      // console.log(file);

      return new Promise((resolve, reject) => {
        const uploadStream = v2.uploader.upload_stream(
          {
            resource_type: 'auto',
            cloud_name: 'dxy3sjsig',
            api_key: '514265386468787',
            api_secret: '5rmIgAfAsl-O3y3EoS4i5AgKnSE',
          },

          (error, result) => {
            if (error) {
              console.log(error);
              reject(new Error('Failed to upload file to Cloudinary'));
            } else {
              resolve(result);
            }
          },
        );
        uploadStream.end(file);
      });
    } catch (error) {
      console.error(error);
      // Handle error
      throw new BadRequestException('Invalid file type.');
    }
  }
}
