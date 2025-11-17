import {
  IsOptional,
  IsArray,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetTweetsQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by category names (comma-separated or multiple params)',
    type: [String],
    example: ['Company', 'Macro & Economy'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v);
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description:
      'Filter by sub-category names (comma-separated or multiple params)',
    type: [String],
    example: ['Earnings', 'Guidance'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v);
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v);
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  subCategories?: string[];

  @ApiPropertyOptional({
    description: 'Search in tickers or sectors',
    example: 'AAPL',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter from date (ISO date string)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter to date (ISO date string)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 50,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 50;
}
