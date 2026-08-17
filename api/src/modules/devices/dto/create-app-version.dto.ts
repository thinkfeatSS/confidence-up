import { IsEnum, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Platform } from '@prisma/client';

export class CreateAppVersionDto {
  @IsEnum(Platform)
  platform: Platform;

  @IsString()
  version: string;

  @IsBoolean()
  isForceUpdate: boolean;

  @IsString()
  minSupportedVersion: string;

  @IsString()
  @IsOptional()
  releaseNotes?: string;
}
