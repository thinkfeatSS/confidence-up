import { Module } from '@nestjs/common';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { MissionsCron } from './missions.cron';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [GamificationModule],
  controllers: [MissionsController],
  providers: [MissionsService, MissionsCron],
  exports: [MissionsService, MissionsCron],
})
export class MissionsModule {}
