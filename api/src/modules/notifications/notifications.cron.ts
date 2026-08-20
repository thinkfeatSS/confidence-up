import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { isInternalCronEnabled } from '../../common/utils/cron-schedule.util';

@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 20 * * *')
  async onStreakSchedule() {
    if (!isInternalCronEnabled(this.configService)) return;
    await this.sendStreakReminders();
  }

  @Cron('0 9 * * *')
  async onMissionSchedule() {
    if (!isInternalCronEnabled(this.configService)) return;
    await this.sendMissionReminders();
  }

  @Cron('0 14 * * *')
  async onPracticeSchedule() {
    if (!isInternalCronEnabled(this.configService)) return;
    await this.sendPracticeReminders();
  }

  async sendStreakReminders() {
    await this.notificationsService.sendStreakReminders();
    this.logger.log('Streak reminders sent');
    return { completed: true };
  }

  async sendMissionReminders() {
    await this.notificationsService.sendMissionReminders();
    this.logger.log('Mission reminders sent');
    return { completed: true };
  }

  async sendPracticeReminders() {
    await this.notificationsService.sendDailyPracticePrompts();
    this.logger.log('Daily practice prompt push notifications sent');
    return { completed: true };
  }
}
