import { IsString, Length } from 'class-validator';

export class ApplyReferralDto {
  @IsString()
  @Length(8, 8)
  code: string;
}
