import { IsBoolean } from 'class-validator';

export class UpdateWindowScheduleStatusDto {
  @IsBoolean()
  isActive: boolean;
}
