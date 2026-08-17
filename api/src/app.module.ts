import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BadgesModule } from './modules/badges/badges.module';
import { FearCategoriesModule } from './modules/fear-categories/fear-categories.module';
import { MissionsModule } from './modules/missions/missions.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { SkillTreeModule } from './modules/skill-tree/skill-tree.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { SpeechModule } from './modules/speech/speech.module';
import { JournalModule } from './modules/journal/journal.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { SupportModule } from './modules/support/support.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { ReferralModule } from './modules/referral/referral.module';
import { ActivityModule } from './modules/activity/activity.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { CoachModule } from './modules/coach/coach.module';
import { DailyModule } from './modules/daily/daily.module';
import { DevicesModule } from './modules/devices/devices.module';
import { AuditModule } from './modules/audit/audit.module';
import { ContactModule } from './modules/contact/contact.module';
import { CronModule } from './modules/cron/cron.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      // Production (Hostinger hPanel): use platform env only — never a stale uploaded .env
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    BadgesModule,
    FearCategoriesModule,
    MissionsModule,
    ChallengesModule,
    SkillTreeModule,
    GamificationModule,
    SpeechModule,
    JournalModule,
    NotificationsModule,
    AnalyticsModule,
    AnnouncementsModule,
    SupportModule,
    FeedbackModule,
    ReferralModule,
    ActivityModule,
    ComplianceModule,
    CoachModule,
    DailyModule,
    DevicesModule,
    AuditModule,
    ContactModule,
    CronModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
