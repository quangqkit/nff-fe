import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface UploadResult {
  url: string;
  key: string;
  path: string;
}

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucketName: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        'Supabase credentials not configured. Storage uploads will fail.',
      );
    }

    this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'exports';
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
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      this.logger.log(
        `Uploading file to Supabase: ${filePath} -> ${storagePath}`,
      );

      const fileBuffer = await fs.readFile(filePath);

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true,
          metadata,
        });

      if (error) {
        throw new Error(`Supabase upload failed: ${error.message}`);
      }

      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      this.logger.log(
        `File uploaded successfully to Supabase: ${storagePath} -> ${publicUrl}`,
      );

      return {
        url: publicUrl,
        key: storagePath,
        path: storagePath,
      };
    } catch (error) {
      this.logger.error(
        `Failed to upload file to Supabase: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteFile(storagePath: string): Promise<void> {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([storagePath]);

      if (error) {
        throw new Error(`Supabase delete failed: ${error.message}`);
      }

      this.logger.log(`File deleted from Supabase: ${storagePath}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete file from Supabase: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
