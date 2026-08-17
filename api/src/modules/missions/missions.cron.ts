import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { ConfigService } from '@nestjs/config';

import { MissionsService } from './missions.service';

import { isInternalCronEnabled } from '../../common/utils/cron-schedule.util';



@Injectable()

export class MissionsCron {

  private readonly logger = new Logger(MissionsCron.name);



  constructor(

    private readonly missionsService: MissionsService,

    private readonly configService: ConfigService,

  ) {}



  /** Rotate daily mission at 00:05 UTC every day */

  @Cron('5 0 * * *')

  async onSchedule() {

    if (!isInternalCronEnabled(this.configService)) return;

    await this.assignTodaysMission();

  }



  async assignTodaysMission() {

    const daily = await this.missionsService.ensureDailyMission();

    if (daily) {

      this.logger.log(`Daily mission set for ${daily.date.toISOString().split('T')[0]}`);

      return { date: daily.date.toISOString().split('T')[0], missionId: daily.missionId };

    }

    return { skipped: true, reason: 'no_active_missions' };

  }

}


