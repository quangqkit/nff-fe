import {
  IsString,
  IsNumber,
  IsOptional,
  IsObject,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsEmail,
  IsArray,
} from 'class-validator';

export class CreateReportDto {
  @IsString()
  title: string;

  @IsNumber()
  reportTypeId: number;

  @IsNumber()
  authorId: number;

  @IsOptional()
  @IsObject()
  content?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  htmlFileUrl?: string;

  @IsOptional()
  @IsString()
  googleSlidesUrl?: string;
}

export class GenerateReportDto {
  @IsNumber()
  reportTypeId: number;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsObject()
  content?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  htmlFileUrl?: string;

  @IsOptional()
  @IsString()
  googleSlidesUrl?: string;
}

export class ReportFiltersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ExportReportDto {
  @IsEnum(['html', 'pdf', 'slides'])
  exportType: string;

  @IsOptional()
  @IsObject()
  config?: any;
}

export class ShareReportDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(['view', 'edit'])
  permission?: 'view' | 'edit';
}

export class CreateSectionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsNumber()
  orderIndex: number;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  orderIndex?: number;
}

export class CreateChartDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsObject()
  chartConfig: any;

  @IsOptional()
  @IsObject()
  chartData?: any;

  @IsOptional()
  @IsString()
  chartImagePath?: string;

  @IsNumber()
  orderIndex: number;
}
