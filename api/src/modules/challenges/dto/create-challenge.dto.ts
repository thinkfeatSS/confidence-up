import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Difficulty } from '@prisma/client';

export class CreateChallengeDto {
  @IsString() title: string;
  @IsString() description: string;
  @IsString() category: string;
  @IsEnum(Difficulty) difficulty: Difficulty;
  @IsNumber() @IsOptional() xpReward?: number;
  @IsArray() @IsString({ each: true }) tips: string[];
  @IsNumber() @IsOptional() durationDays?: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
