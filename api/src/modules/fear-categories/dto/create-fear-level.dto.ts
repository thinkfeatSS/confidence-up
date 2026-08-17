import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateFearLevelDto {
  @IsNumber() levelNumber: number;
  @IsString() title: string;
  @IsString() description: string;
  @IsNumber() @IsOptional() xpReward?: number;
}
