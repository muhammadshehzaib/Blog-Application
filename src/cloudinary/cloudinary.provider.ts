import { v2 } from 'cloudinary';
export const CLOUDINARY = 'Cloudinary';

export const CloudinaryProvider = {
  provide: CLOUDINARY,
  useFactory: () => {
    return v2.config({
      cloud_name: 'dxy3sjsig',
      api_key: '514265386468787',
      api_secret: '5rmIgAfAsl-O3y3EoS4i5AgKnSE',
    });
  },
};
