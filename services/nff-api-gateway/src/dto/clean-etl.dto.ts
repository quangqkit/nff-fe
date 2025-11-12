import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CleanETLTablesDto {
  @ApiProperty({
    description:
      'Confirmation required to clean ETL tables. Must be set to true.',
    example: true,
    required: true,
  })
  @IsBoolean()
  confirmCleanup: boolean;
}
