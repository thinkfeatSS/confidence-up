import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsOptional()
  @IsString()
  deviceToken?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}
