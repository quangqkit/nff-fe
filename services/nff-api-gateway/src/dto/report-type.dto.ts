import { IsString, IsOptional, IsObject, IsBoolean } from 'class-validator';
import type { ReportTypeTemplateConfig } from '../types/report-type.types';

export class CreateReportTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  templateConfig?: ReportTypeTemplateConfig;
}

export class UpdateReportTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  templateConfig?: ReportTypeTemplateConfig;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
