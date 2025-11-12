import { IsString, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateChartConfigRequest {
  @ApiProperty({
    description: 'Chart position in document',
    example: 'square',
    enum: ['inline', 'square', 'tight', 'behind', 'front', 'top-bottom'],
  })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({
    description: 'Custom chart configuration as JSON string',
    example:
      '{"colors":{"primary":"#3B82F6","secondary":"#10B981"},"fontSize":"16px","icon":"chart-line","size":"large"}',
  })
  @IsString()
  @IsNotEmpty()
  config: string;
}

export interface UpdateChartConfigResponse {
  id: number;
  sectionChartId: number;
  position: string;
  config: string;
  updatedAt: Date;
}

export class GetChartConfigRequest {
  @ApiProperty({
    description: 'Chart ID to get config for',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  chartId: number;
}

export interface GetChartConfigResponse {
  id: number;
  sectionChartId: number;
  position: string;
  config: string;
  createdAt: Date;
  updatedAt: Date;
}
