import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BlockType } from '../types/block.types';

// Create Block DTO
export class CreateBlockDto {
  @IsString()
  name: string;

  @IsEnum(BlockType)
  type: BlockType;

  @IsObject()
  content: Record<string, any>;

  @IsNumber()
  @Min(1)
  @Max(12)
  columns: number = 12;

  @IsNumber()
  @Min(0)
  orderIndex: number;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean = true;
}

// Update Block DTO
export class UpdateBlockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  columns?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}

// Text Block specific DTOs
export class CreateTextBlockDto {
  @IsString()
  name: string;

  @IsEnum(BlockType)
  type: BlockType;

  @IsNumber()
  @Min(1)
  @Max(12)
  columns: number = 12;

  @IsNumber()
  @Min(0)
  orderIndex: number;

  @Type(() => Object)
  content: {
    richText: string;
    plainText?: string;
  };
}

export class UpdateTextBlockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  columns?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @Type(() => Object)
  content?: {
    richText?: string;
    plainText?: string;
  };
}

// Chart Block specific DTOs
export class CreateChartBlockDto {
  @IsString()
  name: string;

  @IsEnum(BlockType)
  type: BlockType;

  @IsNumber()
  @Min(1)
  @Max(12)
  columns: number = 12;

  @IsNumber()
  @Min(0)
  orderIndex: number;

  @Type(() => Object)
  content: {
    chartTitle: string;
    chartConfig: Record<string, any>;
    chartData?: Record<string, any>;
    chartImagePath?: string;
    indicatorConfigs?: Array<{
      indicatorId: number;
      chartType: string;
      dateRangeStart: Date;
      dateRangeEnd: Date;
    }>;
  };
}

export class UpdateChartBlockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  columns?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @Type(() => Object)
  content?: {
    chartTitle?: string;
    chartConfig?: Record<string, any>;
    chartData?: Record<string, any>;
    chartImagePath?: string;
    indicatorConfigs?: Array<{
      indicatorId: number;
      chartType: string;
      dateRangeStart: Date;
      dateRangeEnd: Date;
    }>;
  };
}

// Table Block specific DTOs
export class CreateTableBlockDto {
  @IsString()
  name: string;

  @IsEnum(BlockType)
  type: BlockType;

  @IsNumber()
  @Min(1)
  @Max(12)
  columns: number = 12;

  @IsNumber()
  @Min(0)
  orderIndex: number;

  @Type(() => Object)
  content: {
    tableTitle?: string;
    headers: string[];
    rows: Array<Array<string | number>>;
    styling?: {
      headerStyle?: Record<string, string>;
      rowStyle?: Record<string, string>;
      alternateRowColors?: boolean;
    };
  };
}

export class UpdateTableBlockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  columns?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @Type(() => Object)
  content?: {
    tableTitle?: string;
    headers?: string[];
    rows?: Array<Array<string | number>>;
    styling?: {
      headerStyle?: Record<string, string>;
      rowStyle?: Record<string, string>;
      alternateRowColors?: boolean;
    };
  };
}

// Bullets Block specific DTOs
export class CreateBulletsBlockDto {
  @IsString()
  name: string;

  @IsEnum(BlockType)
  type: BlockType;

  @IsNumber()
  @Min(1)
  @Max(12)
  columns: number = 12;

  @IsNumber()
  @Min(0)
  orderIndex: number;

  @Type(() => Object)
  content: {
    title?: string;
    bullets: Array<{
      id: string;
      text: string;
      level: number;
      style?: 'bullet' | 'number' | 'dash' | 'arrow';
    }>;
  };
}

export class UpdateBulletsBlockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  columns?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @Type(() => Object)
  content?: {
    title?: string;
    bullets?: Array<{
      id: string;
      text: string;
      level: number;
      style?: 'bullet' | 'number' | 'dash' | 'arrow';
    }>;
  };
}

// Notes Block specific DTOs
export class CreateNotesBlockDto {
  @IsString()
  name: string;

  @IsEnum(BlockType)
  type: BlockType;

  @IsNumber()
  @Min(1)
  @Max(12)
  columns: number = 12;

  @IsNumber()
  @Min(0)
  orderIndex: number;

  @Type(() => Object)
  content: {
    title?: string;
    noteText: string;
    noteType?: 'info' | 'warning' | 'error' | 'success' | 'neutral';
    backgroundColor?: string;
    borderColor?: string;
  };
}

export class UpdateNotesBlockDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  columns?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @Type(() => Object)
  content?: {
    title?: string;
    noteText?: string;
    noteType?: 'info' | 'warning' | 'error' | 'success' | 'neutral';
    backgroundColor?: string;
    borderColor?: string;
  };
}

// Section DTOs
export class CreateSectionDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean = true;

  @IsNumber()
  @Min(0)
  orderIndex: number;
}

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}

// Bulk operations DTOs
export class ReorderBlocksDto {
  @IsArray()
  @Type(() => Object)
  blocks: Array<{
    id: number;
    orderIndex: number;
  }>;
}

export class DuplicateBlockDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}

export class BlockResponseDto {
  id: number;
  sectionId: number;
  name: string;
  type: BlockType;
  content: Record<string, any>;
  columns: number;
  orderIndex: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SectionResponseDto {
  id: number;
  reportId: number;
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  blocks: BlockResponseDto[];
}

export class ReportResponseDto {
  id: number;
  title: string;
  reportTypeId: number;
  status: string;
  authorId: number;
  metadata?: Record<string, any>;
  summary?: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  sections: SectionResponseDto[];
}
