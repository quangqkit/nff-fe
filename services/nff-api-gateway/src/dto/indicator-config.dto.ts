import { IsString, IsDateString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateIndicatorConfigRequest {
  @ApiProperty({
    description: 'Chart type for the indicator',
    example: 'line',
    enum: ['line', 'bar', 'area', 'pie', 'scatter'],
  })
  @IsString()
  @IsIn(['line', 'bar', 'area', 'pie', 'scatter'])
  chartType: string;

  @ApiProperty({
    description: 'Start date for the indicator data range',
    example: '2020-01-01',
  })
  @IsDateString()
  dateRangeStart: string;

  @ApiProperty({
    description: 'End date for the indicator data range',
    example: '2025-01-01',
  })
  @IsDateString()
  dateRangeEnd: string;
}

export interface UpdateIndicatorConfigResponse {
  id: number;
  sectionChartId: number;
  indicatorId: number;
  chartType: string;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  updatedAt: Date;
}
