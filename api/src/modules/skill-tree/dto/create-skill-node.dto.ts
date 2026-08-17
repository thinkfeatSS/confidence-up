import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateSkillNodeDto {
  @IsString() name: string;
  @IsString() description: string;
  @IsString() branch: string;
  @IsNumber() @IsOptional() tier?: number;
  @IsString() @IsOptional() parentNodeId?: string;
  @IsNumber() @IsOptional() xpRequired?: number;
  @IsNumber() positionX: number;
  @IsNumber() positionY: number;
  @IsBoolean() @IsOptional() isActive?: boolean;
}
