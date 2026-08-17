import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MissionsService } from '../missions/missions.service';

const DAILY_TIPS = [
  'Small daily actions compound into lasting confidence.',
  'One focused practice beats ten distracted attempts.',
  'Your streak protects momentum — show up today.',
  'Speak out loud, even for 60 seconds. It counts.',
  'Confidence is trained, not inherited. You are building it.',
];

@Injectable()
export class DailyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly missionsService: MissionsService,
  ) {}

  private startOfDay(input = new Date()) {
    const date = new Date(input);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private tipForDay(date: Date) {
    const index = Math.floor(date.getTime() / (24 * 60 * 60 * 1000)) % DAILY_TIPS.length;
    return DAILY_TIPS[index];
  }

  private async spotlightChallenge(userId: string) {
    const day = this.startOfDay();
    const oneDay = await this.prisma.challenge.findMany({
      where: { isActive: true, durationDays: 1 },
      orderBy: { createdAt: 'asc' },
    });
    const pool =
      oneDay.length > 0
        ? oneDay
        : await this.prisma.challenge.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          });

    if (!pool.length) return null;

    const index = Math.floor(day.getTime() / (24 * 60 * 60 * 1000)) % pool.length;
    const challenge = pool[index];

    const userChallenge = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId: challenge.id } },
      select: { startedAt: true, completedAt: true, isBookmarked: true },
    });

    return {
      ...challenge,
      userStatus: userChallenge
        ? {
            started: !!userChallenge.startedAt,
            completed: !!userChallenge.completedAt,
            isBookmarked: userChallenge.isBookmarked,
          }
        : null,
    };
  }

  async getHub(userId: string) {
    const today = this.startOfDay();
    const [dailyPayload, challenge, streak, user] = await Promise.all([
      this.missionsService.findToday(userId),
      this.spotlightChallenge(userId),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { xpTotal: true, level: true },
      }),
    ]);

    const mission = dailyPayload?.mission ?? null;
    const missionCompleted = !!mission?.userStatus?.completedAt;

    const completedToday = await this.prisma.userMission.count({
      where: {
        userId,
        completedAt: { gte: today },
      },
    });

    return {
      date: today.toISOString().split('T')[0],
      tip: this.tipForDay(today),
      streak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      xpTotal: user?.xpTotal ?? 0,
      level: user?.level ?? 1,
      mission,
      missionCompleted,
      challenge,
      stats: {
        missionsCompletedToday: completedToday,
        dailyGoalMet: missionCompleted,
      },
    };
  }
}
