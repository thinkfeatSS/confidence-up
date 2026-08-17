import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { isInternalCronEnabled } from '../../common/utils/cron-schedule.util';

@Injectable()
export class WeeklyReportCron {
  private readonly logger = new Logger(WeeklyReportCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 9 * * 1')
  async onSchedule() {
    if (!isInternalCronEnabled(this.configService)) return;
    await this.sendWeeklyReports();
  }

  async sendWeeklyReports() {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const users = await this.prisma.user.findMany({
      where: {
        isBlocked: false,
        settings: { weeklyReportEmail: true },
      },
      select: {
        id: true,
        name: true,
        email: true,
        confidenceScore: true,
        streak: { select: { currentStreak: true } },
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const user of users) {
      const sessions = await this.prisma.speechSession.findMany({
        where: { userId: user.id, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
      });

      if (!sessions.length) {
        skipped += 1;
        continue;
      }

      const scores = sessions.map((session) => session.overallConfidenceScore);
      const avgConfidence = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      );
      const bestScore = Math.max(...scores);

      const dimensionKeys = [
        'speechFluencyScore',
        'vocabularyScore',
        'structureScore',
        'topicRelevanceScore',
        'energyScore',
        'practiceConsistencyScore',
      ] as const;

      let topDimension = 'Fluency';
      let topImprovement = 0;

      for (const key of dimensionKeys) {
        const values = sessions
          .map((session) => {
            const components = session.confidenceComponents as Record<string, number> | null;
            return components?.[key] ?? 0;
          })
          .filter((value) => value > 0);
        if (!values.length) continue;
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
        if (avg > topImprovement) {
          topImprovement = avg;
          topDimension = key.replace('Score', '').replace(/([A-Z])/g, ' $1').trim();
        }
      }

      await this.mailService.sendWeeklyReport(user.email, user.name, {
        sessionsCount: sessions.length,
        avgConfidence,
        bestScore,
        streak: user.streak?.currentStreak ?? 0,
        topDimension,
      });
      sent += 1;
    }

    this.logger.log(`Weekly reports sent: ${sent}, skipped: ${skipped}`);
    return { sent, skipped, eligible: users.length };
  }
}
