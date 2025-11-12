import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportExcelDto {
  @ApiProperty({ description: 'Sheet name', example: 'Macro' })
  @IsString()
  sheetName: string;

  @ApiProperty({ description: 'Category name', example: 'Macro' })
  @IsString()
  categoryName: string;
}

export class FullFetchDto {
  @ApiProperty({ description: 'Category name', example: 'Macro' })
  @IsString()
  categoryName: string;

  @ApiPropertyOptional({
    description: 'Start date (YYYY-MM-DD)',
    example: '2000-01-01',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Minimum importance level (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  importanceMin?: number;
}

export class IncrementalFetchDto {
  @ApiProperty({ description: 'Category name', example: 'Macro' })
  @IsString()
  categoryName: string;

  @ApiPropertyOptional({
    description: 'Number of days back',
    example: 30,
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  daysBack?: number;

  @ApiPropertyOptional({
    description: 'Minimum importance level (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  importanceMin?: number;
}
