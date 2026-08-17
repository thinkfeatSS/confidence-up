import { IsString, IsEnum, IsNumber, IsBoolean, IsOptional, IsObject, Min } from 'class-validator';
import { BadgeTier } from '@prisma/client';

export class CreateBadgeDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsString() icon: string;
  @IsEnum(BadgeTier) tier: BadgeTier;
  @IsString() category: string;
  @IsObject() criteria: Record<string, any>;
  @IsNumber() @Min(0) xpReward: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
