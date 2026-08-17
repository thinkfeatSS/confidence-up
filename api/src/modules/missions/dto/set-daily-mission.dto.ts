import { IsString, IsDateString } from 'class-validator';

export class SetDailyMissionDto {
  @IsString() missionId: string;
  @IsDateString() date: string;
}
