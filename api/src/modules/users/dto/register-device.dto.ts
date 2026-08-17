import { IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
  @IsString()
  deviceToken: string;

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
