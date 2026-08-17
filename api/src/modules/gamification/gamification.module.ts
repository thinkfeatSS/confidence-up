import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationCron } from './gamification.cron';
import { BadgesModule } from '../badges/badges.module';

@Module({
  imports: [BadgesModule],
  controllers: [GamificationController],
  providers: [GamificationService, GamificationCron],
  exports: [GamificationService, GamificationCron],
})
export class GamificationModule {}
