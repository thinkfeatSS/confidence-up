import { IsString, IsEnum, IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { AnnouncementType } from '@prisma/client';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(AnnouncementType)
  @IsOptional()
  type?: AnnouncementType = AnnouncementType.INFO;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
