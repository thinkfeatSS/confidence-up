import { IsString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { Difficulty } from '@prisma/client';

export class MissionFilterDto {
  @IsString() @IsOptional() category?: string;
  @IsEnum(Difficulty) @IsOptional() difficulty?: Difficulty;
  @IsString() @IsOptional() search?: string;
  @Type(() => Number) @IsNumber() @IsOptional() page?: number;
  @Type(() => Number) @IsNumber() @IsOptional() limit?: number;
}
