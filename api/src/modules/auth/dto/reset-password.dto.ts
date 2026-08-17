import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @Transform(({ value }) => (value == null ? value : String(value).trim()))
  @IsString()
  @Length(6, 6)
  otp: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}
