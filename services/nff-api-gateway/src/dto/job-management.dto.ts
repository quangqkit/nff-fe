import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

export enum JobStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class JobListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: JobStatus })
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @ApiPropertyOptional({ description: 'Start date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date filter (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
    minimum: 1,
    maximum: 200,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class JobDetailResponseDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty({ enum: JobStatus })
  status: JobStatus;

  @ApiProperty()
  totalIndicators: number;

  @ApiProperty()
  successful: number;

  @ApiProperty()
  failed: number;

  @ApiProperty()
  blocked: number;

  @ApiProperty()
  startedAt: string;

  @ApiPropertyOptional()
  completedAt?: string;

  @ApiPropertyOptional()
  durationSeconds?: number;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiProperty()
  createdAt: string;
}

export class JobListResponseDto {
  @ApiProperty({ type: [JobDetailResponseDto] })
  jobs: JobDetailResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  summary: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export class RetryJobDto {
  @ApiProperty({ description: 'Job ID to retry' })
  @IsString()
  jobId: string;
}
