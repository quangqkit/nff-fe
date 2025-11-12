import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsIn,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class DateRangeDto {
  @ApiProperty({
    description: 'Date range preset',
    example: '5Y',
    enum: ['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', 'custom'],
  })
  @IsString()
  @IsIn(['1M', '3M', '6M', '1Y', '2Y', '5Y', '10Y', 'custom'])
  preset: string;

  @ApiProperty({
    description: 'Custom start date (required when preset is custom)',
    example: '2000-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  customStart?: string;

  @ApiProperty({
    description: 'Custom end date (required when preset is custom)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  customEnd?: string;
}

export class SelectedIndicatorDto {
  @ApiProperty({
    description: 'ID of the indicator',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({
    description: 'Chart type for this indicator',
    example: 'bar',
    enum: ['line', 'bar', 'area', 'pie', 'scatter'],
  })
  @IsString()
  @IsIn(['line', 'bar', 'area', 'pie', 'scatter'])
  chartType: string;

  @ApiProperty({
    description: 'Date range configuration for this indicator',
    type: DateRangeDto,
  })
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange: DateRangeDto;
}

export class GenerateReportRequest {
  @ApiProperty({
    description: 'ID of the report type to generate',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  reportTypeId: number;
}

export interface GenerateReportResponse {
  id: number;
  title: string;
  status: string;
  sections: {
    id: number;
    title: string;
    content: string | null;
    orderIndex: number;
    charts: any[];
  }[];
}

export class CreateChartRequest {
  @ApiProperty({
    description: 'ID of the report',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  reportId: number;

  @ApiProperty({
    description: 'ID of the section to add chart to',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  sectionId: number;

  @ApiProperty({
    description: 'ID of the chart category',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({
    description: 'Array of selected indicators with configuration',
    type: [SelectedIndicatorDto],
    example: [
      {
        id: 1,
        chartType: 'bar',
        dateRange: {
          preset: '5Y',
          customStart: '2000-01-01T00:00:00.000Z',
          customEnd: '2025-01-01T00:00:00.000Z',
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedIndicatorDto)
  @IsNotEmpty()
  selectedIndicators: SelectedIndicatorDto[];

  @ApiProperty({
    description: 'Chart configuration object',
    example: {
      position: 'top-left',
      config: '{"colors":{"primary":"#3B82F6"},"fontSize":"14px"}',
    },
  })
  @IsNotEmpty()
  chartConfig: {
    position: string;
    config: string;
  };
}

export interface CreateChartResponse {
  id: number;
  title: string | null;
  chartConfig: any;
  chartData: any;
  chartImagePath: string | null;
  orderIndex: number;
}

export class GenerateChartRequest {
  @ApiProperty({
    description: 'ID of the chart to generate',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  chartId: number;
}

export interface GenerateChartResponse {
  id: number;
  title: string | null;
  chartConfig: any;
  chartData: any;
  chartImagePath: string | null;
  orderIndex: number;
  generatedAt: Date;
  status: 'generated' | 'failed';
  preview?: {
    chartData: any;
    chartConfig: any;
    metadata: {
      totalDataPoints: number;
      dateRange: {
        start: Date;
        end: Date;
      };
      dataSources: string[];
      lastUpdated: Date;
      dataQuality: 'high' | 'medium' | 'low';
    };
  };
}

export class AddSectionRequest {
  @ApiProperty({
    description: 'ID of the report to add section to',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  reportId: number;
}

export interface AddSectionResponse {
  id: number;
  reportId: number;
  title: string;
  content: string | null;
  orderIndex: number;
  charts: any[];
}

export class GetSectionRequest {
  @ApiProperty({
    description: 'ID of the report',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  reportId: number;

  @ApiProperty({
    description: 'ID of the section',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  sectionId: number;
}

export interface GetSectionResponse {
  id: number;
  reportId: number;
  title: string;
  content: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  charts: any[];
}

export class DeleteSectionRequest {
  @ApiProperty({
    description: 'ID of the report',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  reportId: number;

  @ApiProperty({
    description: 'ID of the section',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  sectionId: number;
}

export interface DeleteSectionResponse {
  message: string;
  deletedSectionId: number;
}

export class DeleteChartRequest {
  @ApiProperty({
    description: 'ID of the chart to delete',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  chartId: number;
}

export interface DeleteChartResponse {
  message: string;
  deletedChartId: number;
}

export class UpdateChartRequest {
  @ApiProperty({
    description: 'ID of the chart to update',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  chartId: number;

  @ApiProperty({
    description: 'ID of the chart category',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({
    description: 'Array of selected indicators with configuration',
    type: [SelectedIndicatorDto],
    example: [
      {
        id: 1,
        chartType: 'bar',
        dateRange: {
          preset: '5Y',
          customStart: '2000-01-01T00:00:00.000Z',
          customEnd: '2025-01-01T00:00:00.000Z',
        },
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedIndicatorDto)
  @IsNotEmpty()
  selectedIndicators: SelectedIndicatorDto[];

  @ApiProperty({
    description: 'Chart configuration object',
    example: {
      position: 'top-left',
      config: '{"colors":{"primary":"#3B82F6"},"fontSize":"14px"}',
    },
  })
  @IsNotEmpty()
  chartConfig: {
    position: string;
    config: string;
  };
}

export interface UpdateChartResponse {
  id: number;
  title: string | null;
  chartConfig: any;
  chartData: any;
  chartImagePath: string | null;
  orderIndex: number;
  updatedAt: Date;
}

export class GetChartRequest {
  @ApiProperty({
    description: 'ID of the chart to get',
    example: 1,
    type: 'number',
  })
  @IsNumber()
  @IsNotEmpty()
  chartId: number;
}

export interface GetChartResponse {
  id: number;
  sectionId: number;
  title: string | null;
  chartConfig: any;
  chartData: any;
  chartImagePath: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  preview?: {
    chartData: any;
    chartConfig: any;
    metadata: {
      totalDataPoints: number;
      dateRange: {
        start: Date;
        end: Date;
      };
      dataSources: string[];
      lastUpdated: Date;
      dataQuality: 'high' | 'medium' | 'low';
    };
  };
  chartSelection: {
    id: number;
    categoryName: string;
    selectedIndicators: Array<{
      id: number;
      chartType: string;
      dateRange: {
        preset: string;
        customStart?: string;
        customEnd?: string;
      };
    }>;
  } | null;
  chartConfiguration: {
    id: number;
    config: string;
  } | null;
}
