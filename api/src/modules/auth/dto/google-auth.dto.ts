import { IsString, IsOptional } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  idToken: string;

  @IsOptional()
  @IsString()
  deviceToken?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  platform?: 'IOS' | 'ANDROID';

  @IsOptional()
  @IsString()
  appVersion?: string;
}
