import { Express } from 'express';
import { AWSFileController } from './file-controllers/aws-file-controller';
import { GCPFileController } from './file-controllers/gcp-file-controller';
import { CloudinaryFileController } from './file-controllers/cloudinary-file-controller';

export interface MediaLibraryResult {
  files: Array<{
    url: string;
    name: string;
    title?: string;
    description?: string;
    isImage: boolean;
    createdAt?: Date;
    size?: number;
  }>;
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface FileMetadata {
  title?: string;
  description?: string;
}

export interface FileController {
  uploadFile(
    file: Express.Multer.File,
    path?: string,
    metadata?: FileMetadata
  ): Promise<string>;
  getMediaLibrary(
    extensions: string[],
    page: number,
    limit: number,
    path?: string
  ): Promise<MediaLibraryResult>;
}

export class FileControllerFactory {
  static createFileController(): FileController {
    const storageType = process.env.STORAGE_TYPE?.toLowerCase() || 'aws';

    switch (storageType) {
      case 'aws':
        return new AWSFileController();
      case 'gcp':
        return new GCPFileController();
      case 'cloudinary':
        return new CloudinaryFileController();
      default:
        throw new Error(`Unsupported storage type: ${storageType}`);
    }
  }
}
