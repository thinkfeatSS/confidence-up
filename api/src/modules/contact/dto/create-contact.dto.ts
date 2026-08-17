import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const SUBJECTS = ['general', 'support', 'partnership', 'press'] as const;

export class CreateContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsIn(SUBJECTS)
  subject: (typeof SUBJECTS)[number];

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(0)
  website?: string;
}
