import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsArray() @IsString({ each: true }) @IsOptional() preferredLanguages?: string[];
}
