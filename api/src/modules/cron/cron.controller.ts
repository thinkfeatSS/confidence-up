import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CronSecretGuard } from './cron-secret.guard';
import { MissionsCron } from '../missions/missions.cron';
import { GamificationCron } from '../gamification/gamification.cron';
import { NotificationsCron } from '../notifications/notifications.cron';
import { WeeklyReportCron } from '../users/weekly-report.cron';

@Controller('cron')
@Public()
@SkipThrottle()
@UseGuards(CronSecretGuard)
export class CronController {
  constructor(
    private readonly missionsCron: MissionsCron,
    private readonly gamificationCron: GamificationCron,
    private readonly notificationsCron: NotificationsCron,
    private readonly weeklyReportCron: WeeklyReportCron,
  ) {}

  /** Daily mission rotation — schedule: 00:05 UTC */
  @Post('daily-mission')
  @HttpCode(HttpStatus.OK)
  async dailyMission() {
    const result = await this.missionsCron.assignTodaysMission();
    return { ok: true, job: 'daily-mission', ...result };
  }

  /** Reset expired streaks — schedule: 00:00 UTC */
  @Post('reset-streaks')
  @HttpCode(HttpStatus.OK)
  async resetStreaks() {
    const result = await this.gamificationCron.resetExpiredStreaks();
    return { ok: true, job: 'reset-streaks', ...result };
  }

  /** Push reminders for users at risk of losing streak — schedule: 08:00 UTC */
  @Post('streak-reminders')
  @HttpCode(HttpStatus.OK)
  async streakReminders() {
    const result = await this.notificationsCron.sendStreakReminders();
    return { ok: true, job: 'streak-reminders', ...result };
  }

  /** Push reminders for incomplete daily mission — schedule: 09:00 UTC */
  @Post('mission-reminders')
  @HttpCode(HttpStatus.OK)
  async missionReminders() {
    const result = await this.notificationsCron.sendMissionReminders();
    return { ok: true, job: 'mission-reminders', ...result };
  }

  /** Weekly progress email — schedule: Monday 09:00 UTC */
  @Post('weekly-reports')
  @HttpCode(HttpStatus.OK)
  async weeklyReports() {
    const result = await this.weeklyReportCron.sendWeeklyReports();
    return { ok: true, job: 'weekly-reports', ...result };
  }
}
