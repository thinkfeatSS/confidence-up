import { IsString, IsArray, IsOptional } from 'class-validator';

export class OnboardingDto {
  @IsArray() @IsString({ each: true }) @IsOptional() fears?: string[];
  @IsArray() @IsString({ each: true }) @IsOptional() goals?: string[];
  @IsString() @IsOptional() dailyTime?: string;
}
