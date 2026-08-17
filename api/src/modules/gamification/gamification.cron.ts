import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { GamificationService } from './gamification.service';
import { isInternalCronEnabled } from '../../common/utils/cron-schedule.util';

@Injectable()
export class GamificationCron {
  private readonly logger = new Logger(GamificationCron.name);

  constructor(
    private readonly gamificationService: GamificationService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 0 * * *')
  async onSchedule() {
    if (!isInternalCronEnabled(this.configService)) return;
    await this.resetExpiredStreaks();
  }

  async resetExpiredStreaks() {
    await this.gamificationService.resetExpiredStreaks();
    this.logger.log('Expired streaks reset complete');
    return { completed: true };
  }
}
