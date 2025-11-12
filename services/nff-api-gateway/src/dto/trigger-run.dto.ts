import { IsString, IsOptional, IsDateString, IsObject } from 'class-validator';

export class TriggerRunDto {
  @IsString()
  squidId: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
