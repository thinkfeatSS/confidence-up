import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateMissionDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsString() category: string;
  @IsEnum(Difficulty) difficulty: Difficulty;
  @IsNumber() @IsOptional() xpReward?: number;
  @IsNumber() @IsOptional() estimatedMinutes?: number;
  @IsArray() @IsString({ each: true }) tips: string[];
  @IsString() prompt: string;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
