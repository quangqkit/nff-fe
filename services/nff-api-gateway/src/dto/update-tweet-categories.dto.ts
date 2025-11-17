import { IsArray, IsString, IsObject, IsOptional } from 'class-validator';

export class UpdateTweetCategoriesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsObject()
  subCategories?: Record<string, string[]>;
}
