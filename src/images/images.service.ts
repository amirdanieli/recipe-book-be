import { Inject, Injectable } from '@nestjs/common';
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
import * as toStream from 'streamifier';

type CloudinaryV2 = typeof import('cloudinary').v2;

@Injectable()
export class ImagesService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinary: CloudinaryV2,
  ) {}

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const upload = this.cloudinary.uploader.upload_stream(
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            const message =
              'message' in error ? error.message : 'Cloudinary upload failed';
            return reject(new Error(message));
          }
          if (!result)
            return reject(new Error('Cloudinary upload result is undefined'));
          resolve(result);
        },
      );
      toStream.createReadStream(file.buffer).pipe(upload);
    });
  }
}
