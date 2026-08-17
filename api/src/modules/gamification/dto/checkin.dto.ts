import { IsOptional, IsString } from 'class-validator';

export class CheckinDto {
  @IsOptional()
  @IsString()
  fcmToken?: string;
}
