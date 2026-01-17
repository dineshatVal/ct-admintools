import { SaveOptions, Storage } from '@google-cloud/storage';
import { logger } from '../../utils/logger.utils';
import {
  FileController,
  MediaLibraryResult,
  FileMetadata,
} from '../file-controller';

export class GCPFileController implements FileController {
  private storage: Storage;
  private bucket: string;

  constructor() {
    this.bucket = process.env.GCP_BUCKET_NAME || '';
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      credentials: {
        client_email: process.env.GCP_CLIENT_EMAIL,
        private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    });
  }

  async uploadFile(
    file: any,
    path?: string,
    metadata?: FileMetadata
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucket);
      const directory = path ? `${path}/uploads` : 'uploads';
      const blob = bucket.file(
        `${directory}/${Date.now()}-${file.originalname}`
      );

      // Prepare metadata from title and description if provided
      const metadataOptions: SaveOptions = {
        public: true,
        metadata: {
          metadata: metadata,
          contentType: file.mimetype,
        },
      };

      await blob.save(file.buffer, metadataOptions);

      // Return the public URL of the uploaded file
      return `https://storage.googleapis.com/${this.bucket}/${blob.name}`;
    } catch (error) {
      logger.error('Failed to upload file to GCP:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getMediaLibrary(
    extensions: string[],
    page: number,
    limit: number,
    path?: string
  ): Promise<MediaLibraryResult> {
    try {
      const prefix = path ? `${path}/uploads` : 'uploads';
      const bucket = this.storage.bucket(this.bucket);

      // Get all files with the specified prefix
      const [files] = await bucket.getFiles({ prefix });

      // Filter files by extensions if provided
      let filteredFiles = files;
      if (extensions.length > 0) {
        filteredFiles = files.filter((file) => {
          const fileName = file.name;
          return extensions.some((ext) =>
            fileName.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
          );
        });
      }

      // Calculate total items and pages
      const totalItems = filteredFiles.length;
      const totalPages = Math.ceil(totalItems / limit);

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedFiles = filteredFiles.slice(
        startIndex,
        startIndex + limit
      );

      // Process files to get required information
      const filePromises = paginatedFiles.map(async (file) => {
        const [metadata] = await file.getMetadata();
        const fileName = file.name.split('/').pop() || '';
        const url = `https://storage.googleapis.com/${this.bucket}/${file.name}`;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

        // Ensure title and description are string or undefined
        const title = metadata.metadata?.title
          ? String(metadata.metadata.title)
          : undefined;
        const description = metadata.metadata?.description
          ? String(metadata.metadata.description)
          : undefined;

        return {
          url,
          title,
          description,
          name: fileName,
          isImage,
          createdAt: metadata.timeCreated
            ? new Date(metadata.timeCreated)
            : undefined,
          size: metadata.size ? parseInt(metadata.size.toString()) : undefined,
        };
      });

      const fileResults = await Promise.all(filePromises);

      return {
        files: fileResults,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch media library from GCP:', error);
      throw new Error('Failed to fetch media library');
    }
  }
}
