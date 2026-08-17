import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { CronSecretGuard } from './cron-secret.guard';
import { MissionsModule } from '../missions/missions.module';
import { GamificationModule } from '../gamification/gamification.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MissionsModule, GamificationModule, NotificationsModule, UsersModule],
  controllers: [CronController],
  providers: [CronSecretGuard],
})
export class CronModule {}
