import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../../utils/logger.utils';
import {
  FileController,
  MediaLibraryResult,
  FileMetadata,
} from '../file-controller';

interface CloudinaryResource {
  public_id: string;
  format: string;
  secure_url: string;
  created_at?: string;
  bytes?: number;
  [key: string]: any;
}

export class CloudinaryFileController implements FileController {
  private static readonly IMAGE_FORMATS = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
  ]);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private normalizeExtensions(extensions: string[]): string[] {
    return (extensions || []).map((ext) => ext.toLowerCase());
  }

  private filterResourcesByExtensions(
    resources: CloudinaryResource[],
    extensions: string[]
  ): CloudinaryResource[] {
    const normalized = this.normalizeExtensions(extensions);
    if (normalized.length === 0) return resources;

    return resources.filter((resource: CloudinaryResource) => {
      const fileName = resource.public_id.split('/').pop() || '';
      const formatLower = (resource.format || '').toLowerCase();
      const fileNameLower = fileName.toLowerCase();

      if (normalized.includes(formatLower)) return true;
      return normalized.some((ext) => fileNameLower.endsWith(`.${ext}`));
    });
  }

  private paginate<T>(
    items: T[],
    page: number,
    limit: number
  ): {
    paginated: T[];
    totalItems: number;
    totalPages: number;
  } {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);
    return { paginated, totalItems, totalPages };
  }

  private async fetchResourceContext(
    publicId: string
  ): Promise<{ title?: string; description?: string } | undefined> {
    try {
      const resourceInfo = await cloudinary.api.resource(publicId, {
        context: true,
      });
      const custom = resourceInfo.context?.custom;
      if (!custom) return undefined;
      return {
        title: custom.title ? String(custom.title) : undefined,
        description: custom.description
          ? String(custom.description)
          : undefined,
      };
    } catch (error) {
      logger.error(`Failed to fetch context for resource ${publicId}:`, error);
      return undefined;
    }
  }

  private isImage(format: string | undefined): boolean {
    if (!format) return false;
    return CloudinaryFileController.IMAGE_FORMATS.has(format.toLowerCase());
  }

  private async toMediaFile(resource: CloudinaryResource) {
    const fileName = resource.public_id.split('/').pop() || '';
    const displayName = `${fileName}.${resource.format}`;
    const isImage = this.isImage(resource.format);

    const context = await this.fetchResourceContext(resource.public_id);

    return {
      url: resource.secure_url,
      name: displayName,
      title: context?.title,
      description: context?.description,
      isImage,
      createdAt: resource.created_at
        ? new Date(resource.created_at)
        : undefined,
      size: resource.bytes,
    };
  }

  async uploadFile(
    file: any,
    path?: string,
    metadata?: FileMetadata
  ): Promise<string> {
    try {
      // Convert buffer to base64
      const base64File = file.buffer.toString('base64');
      const dataUri = `data:${file.mimetype};base64,${base64File}`;

      const uploadOptions: any = {
        folder: path || 'uploads',
        resource_type: 'auto',
      };

      // Add metadata as context if provided
      if (metadata) {
        const context: string[] = [];
        if (metadata.title) context.push(`title=${metadata.title}`);
        if (metadata.description)
          context.push(`description=${metadata.description}`);

        if (context.length > 0) {
          uploadOptions.context = context.join('|');
        }
      }

      const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

      return result.secure_url;
    } catch (error) {
      logger.error('Failed to upload file to Cloudinary:', error);
      throw new Error('Failed to upload file');
    }
  }

  async getMediaLibrary(
    extensions: string[],
    page: number,
    limit: number
  ): Promise<MediaLibraryResult> {
    try {
      const searchParams: any = {
        type: 'upload',
        prefix: 'uploads/',
        max_results: 500,
      };

      const result = await cloudinary.api.resources(searchParams);
      const resources = (result.resources as CloudinaryResource[]) || [];

      const filteredResources = this.filterResourcesByExtensions(
        resources,
        extensions
      );

      const { paginated, totalItems, totalPages } = this.paginate(
        filteredResources,
        page,
        limit
      );

      const files = await Promise.all(
        paginated.map((resource) => this.toMediaFile(resource))
      );

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
      logger.error('Failed to fetch media library from Cloudinary:', error);
      throw new Error('Failed to fetch media library');
    }
  }
}
