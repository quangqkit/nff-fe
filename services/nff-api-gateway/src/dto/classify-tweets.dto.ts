import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';

export class ClassifyTweetsDto {
  @IsOptional()
  @IsString()
  tweetId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tweetIds?: string[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  ids?: number[];

  @IsOptional()
  @IsString()
  prompt?: string;
}
