import { IsString, IsOptional } from 'class-validator';

export class AccountDeletionDto {
  @IsString() @IsOptional() reason?: string;
}
