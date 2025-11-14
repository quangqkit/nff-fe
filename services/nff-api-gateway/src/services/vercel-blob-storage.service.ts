import { Injectable, Logger } from '@nestjs/common';
import { put, del, type PutBlobResult } from '@vercel/blob';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
  path: string;
}

@Injectable()
export class VercelBlobStorageService {
  private readonly logger = new Logger(VercelBlobStorageService.name);
  private readonly token: string;
  private readonly access: 'public' | 'private';
  private readonly baseUrl?: string;
  private readonly storeId?: string;

  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN || '';
    this.access = (process.env.BLOB_ACCESS || 'public') as 'public' | 'private';
    this.baseUrl = process.env.BLOB_STORE_BASE_URL;
    this.storeId = process.env.BLOB_STORE_ID;

    if (!this.token) {
      this.logger.warn(
        'Vercel Blob token not configured. Storage uploads will fail.',
      );
    } else {
      if (this.storeId) {
        this.logger.log(`Vercel Blob Store ID: ${this.storeId}`);
      }
      if (this.baseUrl) {
        this.logger.log(`Vercel Blob Base URL: ${this.baseUrl}`);
      }
    }
  }

  async uploadPdfReport(
    filePath: string,
    reportId: string,
  ): Promise<UploadResult> {
    const fileName = path.basename(filePath);
    const storagePath = `pdf/${reportId}/${fileName}`;

    return this.uploadFile(filePath, storagePath, 'application/pdf');
  }

  async uploadHtmlReport(
    filePath: string,
    reportId: string,
  ): Promise<UploadResult> {
    const fileName = path.basename(filePath);
    const storagePath = `html/${reportId}/${fileName}`;

    return this.uploadFile(filePath, storagePath, 'text/html');
  }

  async uploadChartImage(
    filePath: string,
    chartId: string,
    metadata?: Record<string, any>,
  ): Promise<UploadResult> {
    const fileName = path.basename(filePath);
    const storagePath = `charts/${chartId}/${fileName}`;

    return this.uploadFile(filePath, storagePath, 'image/png', metadata);
  }

  private async uploadFile(
    filePath: string,
    storagePath: string,
    contentType: string,
    metadata?: Record<string, any>,
  ): Promise<UploadResult> {
    try {
      if (!this.token) {
        throw new Error('Vercel Blob token not initialized');
      }

      this.logger.log(
        `Uploading file to Vercel Blob: ${filePath} -> ${storagePath}`,
      );

      const fileBuffer = await fs.readFile(filePath);

      const blob: PutBlobResult = await put(storagePath, fileBuffer, {
        access: 'public',
        contentType,
        token: this.token,
        addRandomSuffix: false,
      });

      this.logger.log(
        `File uploaded successfully to Vercel Blob: ${storagePath} -> ${blob.url}`,
      );

      return {
        url: blob.url,
        key: storagePath,
        path: storagePath,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to Vercel Blob: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      if (!this.token) {
        throw new Error('Vercel Blob token not initialized');
      }

      if (this.baseUrl && storagePath) {
        const blobUrl = `${this.baseUrl}/${storagePath}`;
        return this.deleteFileByUrl(blobUrl);
      }

      this.logger.warn(
        `Delete operation requires full blob URL, but only path provided: ${storagePath}. ` +
          `Please use deleteFileByUrl() with the full blob URL instead, or set BLOB_STORE_BASE_URL.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Vercel Blob: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteFileByUrl(blobUrl: string): Promise<void> {
    try {
      if (!this.token) {
        throw new Error('Vercel Blob token not initialized');
      }

      await del(blobUrl, {
        token: this.token,
      });

      this.logger.log(`File deleted from Vercel Blob: ${blobUrl}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Vercel Blob: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
