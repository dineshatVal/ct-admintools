import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { logger } from '../../utils/logger.utils';
import {
  FileController,
  MediaLibraryResult,
  FileMetadata,
} from '../file-controller';

export class AWSFileController implements FileController {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || '';
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadFile(
    file: any,
    path?: string,
    metadata?: FileMetadata
  ): Promise<string> {
    try {
      const key = `${path || 'uploads'}/${Date.now()}-${file.originalname}`;

      // Create command with metadata if provided
      const commandParams: any = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      // Add metadata if provided
      if (metadata) {
        commandParams.Metadata = {};
        if (metadata.title) commandParams.Metadata.title = metadata.title;
        if (metadata.description)
          commandParams.Metadata.description = metadata.description;
      }

      const command = new PutObjectCommand(commandParams);
      await this.s3Client.send(command);

      // Return the public URL of the uploaded file
      return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
      logger.error('Failed to upload file to S3:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getMediaLibrary(
    extensions: string[],
    page: number,
    limit: number
  ): Promise<MediaLibraryResult> {
    try {
      const prefix = 'uploads/';
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 1000, // Get a large batch to filter by extensions
      });

      const response = await this.s3Client.send(command);
      const contents = response.Contents || [];

      // Filter files by extensions if provided
      let filteredFiles = contents;
      if (extensions.length > 0) {
        filteredFiles = contents.filter((item) => {
          const key = item.Key || '';
          return extensions.some((ext) =>
            key.toLowerCase().endsWith(`.${ext.toLowerCase()}`)
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
      const filePromises = paginatedFiles.map(async (item) => {
        const key = item.Key || '';
        const fileName = key.split('/').pop() || '';
        const url = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);

        // Fetch metadata for the file
        const headCommand = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        });

        try {
          const headResponse = await this.s3Client.send(headCommand);
          const title = headResponse.Metadata?.title;
          const description = headResponse.Metadata?.description;

          return {
            url,
            name: fileName,
            title: title ? String(title) : undefined,
            description: description ? String(description) : undefined,
            isImage,
            createdAt: item.LastModified,
            size: item.Size,
          };
        } catch (error) {
          logger.error(`Failed to fetch metadata for file ${key}:`, error);
          return {
            url,
            name: fileName,
            isImage,
            createdAt: item.LastModified,
            size: item.Size,
          };
        }
      });

      const files = await Promise.all(filePromises);

      return {
        files,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch media library from S3:', error);
      throw new Error('Failed to fetch media library');
    }
  }
}
