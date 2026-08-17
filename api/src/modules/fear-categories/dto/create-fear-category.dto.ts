import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateFearCategoryDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsString() icon: string;
  @IsString() color: string;
  @IsNumber() @IsOptional() orderIndex?: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
