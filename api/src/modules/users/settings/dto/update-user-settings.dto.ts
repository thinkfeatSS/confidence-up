import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsBoolean()
  dailyReminders?: boolean;

  @IsOptional()
  @IsBoolean()
  soundEffects?: boolean;

  @IsOptional()
  @IsBoolean()
  darkMode?: boolean;

  @IsOptional()
  @IsBoolean()
  weeklyReportEmail?: boolean;
}
