import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, S3_BUCKET_REGION } from '../config/aws';
import { v4 as uuidv4 } from 'uuid';
import { UploadResponse } from '../types';
import axios, { AxiosRequestConfig } from 'axios';

export class S3Service {
  async uploadFile(
    file: Express.Multer.File,
    userId: string
  ): Promise<UploadResponse> {
    const fileExtension = file.originalname.split('.').pop();
    const key = `uploads/${userId}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const url = `https://${S3_BUCKET}.s3.${S3_BUCKET_REGION}.amazonaws.com/${key}`;

    return {
      url,
      key,
      bucket: S3_BUCKET,
    };
  }

  async uploadFromUrl(
    mediaUrl: string,
    userId: string,
    mediaType: 'image' | 'video',
    options?: { headers?: Record<string, string> }
  ): Promise<UploadResponse> {
    const axiosConfig: AxiosRequestConfig = {
      responseType: 'arraybuffer',
      timeout: 30000,
    };

    if (options?.headers) {
      axiosConfig.headers = options.headers;
    }

    const response = await axios.get(mediaUrl, axiosConfig);

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'] || (mediaType === 'image' ? 'image/jpeg' : 'video/mp4');
    
    const extension = mediaType === 'image' 
      ? (contentType.includes('png') ? 'png' : 'jpg')
      : 'mp4';
    
    const key = `whatsapp/${userId}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);

    const url = `https://${S3_BUCKET}.s3.${S3_BUCKET_REGION}.amazonaws.com/${key}`;

    return {
      url,
      key,
      bucket: S3_BUCKET,
    };
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }
}

export const s3Service = new S3Service();
