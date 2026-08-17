import { IsEnum, IsString } from 'class-validator';
import { Platform } from '@prisma/client';

export class AppVersionCheckDto {
  @IsEnum(Platform)
  platform: Platform;

  @IsString()
  version: string;
}
