import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailModule } from '../../mail/mail.module';
import { UserSettingsController } from './settings/user-settings.controller';
import { UserSettingsService } from './settings/user-settings.service';
import { WeeklyReportCron } from './weekly-report.cron';

@Module({
  imports: [MailModule],
  controllers: [UsersController, UserSettingsController],
  providers: [UsersService, UserSettingsService, WeeklyReportCron],
  exports: [UsersService, UserSettingsService, WeeklyReportCron],
})
export class UsersModule {}
