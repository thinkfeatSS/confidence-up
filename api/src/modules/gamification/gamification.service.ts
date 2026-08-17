import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BadgesService } from '../badges/badges.service';
import { XpSource, ActivityEventType } from '@prisma/client';
import { calculateLevel, getXpProgress } from '../../common/utils/xp-engine.util';

@Injectable()
export class GamificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badgesService: BadgesService,
  ) {}

  async awardXp(
    userId: string,
    amount: number,
    source: XpSource,
    referenceId?: string,
  ): Promise<{ newXp: number; newLevel: number; leveledUp: boolean; newBadges: string[] }> {
    await this.prisma.xpTransaction.create({
      data: { userId, amount, source, referenceId },
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { xpTotal: { increment: amount } },
      select: { xpTotal: true, level: true },
    });

    const newLevel = calculateLevel(updatedUser.xpTotal);
    const leveledUp = newLevel !== updatedUser.level;

    if (leveledUp) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });
      await this.prisma.activityTimeline.create({
        data: {
          userId,
          eventType: ActivityEventType.LEVEL_UP,
          eventData: { newLevel, oldLevel: updatedUser.level },
        },
      });
    }

    const newBadges: string[] = [];

    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    if (streak) {
      const streakBadges = await this.prisma.badge.findMany({
        where: {
          isActive: true,
          criteria: { path: '$.type', equals: 'streak_milestone' },
        },
      });
      for (const badge of streakBadges) {
        const criteria = badge.criteria as { type: string; value: number };
        if (streak.currentStreak >= criteria.value) {
          const awarded = await this.badgesService.awardBadgeToUser(userId, badge.id);
          if (awarded) newBadges.push(badge.name);
        }
      }
    }

    const xpMilestoneBadges = await this.prisma.badge.findMany({
      where: {
        isActive: true,
        criteria: { path: '$.type', equals: 'xp_milestone' },
      },
    });
    for (const badge of xpMilestoneBadges) {
      const criteria = badge.criteria as { type: string; value: number };
      if (updatedUser.xpTotal >= criteria.value) {
        const awarded = await this.badgesService.awardBadgeToUser(userId, badge.id);
        if (awarded) newBadges.push(badge.name);
      }
    }

    const criteriaBadges = await this.evaluateUserBadges(userId);
    for (const badgeName of criteriaBadges) {
      if (!newBadges.includes(badgeName)) newBadges.push(badgeName);
    }

    return { newXp: updatedUser.xpTotal, newLevel, leveledUp, newBadges };
  }

  async evaluateUserBadges(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xpTotal: true, level: true, confidenceScore: true },
    });
    if (!user) return [];

    const [
      speechCount,
      zeroFillerSpeechCount,
      challengeCount,
      missionCount,
      journalCount,
      fearLevelCount,
      skillNodeCount,
      socialChallengeCount,
      academicChallengeCount,
      streak,
      fearCategories,
      recentSpeechScores,
    ] = await Promise.all([
      this.prisma.speechSession.count({ where: { userId } }),
      this.prisma.speechSession.count({ where: { userId, fillerCount: 0 } }),
      this.prisma.userChallenge.count({ where: { userId, completedAt: { not: null } } }),
      this.prisma.userMission.count({ where: { userId, completedAt: { not: null } } }),
      this.prisma.journalEntry.count({ where: { userId } }),
      this.prisma.userFearProgress.count({ where: { userId } }),
      this.prisma.userSkillNode.count({ where: { userId } }),
      this.prisma.userChallenge.count({
        where: { userId, completedAt: { not: null }, challenge: { category: 'social' } },
      }),
      this.prisma.userChallenge.count({
        where: { userId, completedAt: { not: null }, challenge: { category: 'academic' } },
      }),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.fearCategory.findMany({
        where: { isActive: true },
        include: {
          fearLevels: {
            select: {
              id: true,
              userFearProgress: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      }),
      this.prisma.speechSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { overallConfidenceScore: true },
      }),
    ]);

    const completedFearCategoryCount = fearCategories.filter(
      (category) =>
        category.fearLevels.length > 0 &&
        category.fearLevels.every((level) => level.userFearProgress.length > 0),
    ).length;
    const highScoreStreak = recentSpeechScores.length >= 3 &&
      recentSpeechScores.every((session) => session.overallConfidenceScore >= 90);

    const badges = await this.prisma.badge.findMany({ where: { isActive: true } });
    const awarded: string[] = [];

    for (const badge of badges) {
      const criteria = badge.criteria as { type?: string; value?: number };
      const value = criteria.value ?? 0;
      let achieved = false;

      switch (criteria.type) {
        case 'speech_sessions':
          achieved = speechCount >= value;
          break;
        case 'zero_filler_speech':
          achieved = zeroFillerSpeechCount >= value;
          break;
        case 'challenges_completed':
          achieved = challengeCount >= value;
          break;
        case 'missions_completed':
          achieved = missionCount >= value;
          break;
        case 'journal_entries':
          achieved = journalCount >= value;
          break;
        case 'fear_levels_completed':
        case 'fear_level_reached':
          achieved = fearLevelCount >= value;
          break;
        case 'fear_category_complete':
          achieved = completedFearCategoryCount >= value;
          break;
        case 'skill_nodes_unlocked':
          achieved = skillNodeCount >= value;
          break;
        case 'social_challenges':
          achieved = socialChallengeCount >= value;
          break;
        case 'academic_challenges':
          achieved = academicChallengeCount >= value;
          break;
        case 'xp_milestone':
          achieved = user.xpTotal >= value;
          break;
        case 'user_level':
          achieved = user.level >= value;
          break;
        case 'confidence_score':
          achieved = user.confidenceScore >= value;
          break;
        case 'high_score_streak':
          achieved = highScoreStreak;
          break;
        case 'streak_milestone':
          achieved = (streak?.currentStreak ?? 0) >= value;
          break;
        default:
          achieved = false;
      }

      if (achieved) {
        const didAward = await this.badgesService.awardBadgeToUser(userId, badge.id);
        if (didAward) awarded.push(badge.name);
      }
    }

    return awarded;
  }

  async dailyCheckin(userId: string): Promise<{
    xpEarned: number;
    streak: number;
    message: string;
    alreadyDone: boolean;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existing = await this.prisma.dailyCheckin.findFirst({
      where: { userId, date: { gte: today, lt: tomorrow } },
    });

    if (existing) {
      return { alreadyDone: true, xpEarned: 0, streak: 0, message: 'Already checked in today' };
    }

    await this.prisma.dailyCheckin.create({
      data: { userId, date: today, xpEarned: 10 },
    });

    const streak = await this.prisma.streak.findUnique({ where: { userId } });

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentStreak = 1;

    if (streak?.lastCheckinDate) {
      const lastDate = new Date(streak.lastCheckinDate);
      lastDate.setHours(0, 0, 0, 0);

      if (lastDate.getTime() === yesterday.getTime()) {
        currentStreak = (streak.currentStreak || 0) + 1;
      }
    }

    const longestStreak = Math.max(currentStreak, streak?.longestStreak ?? 0);

    await this.prisma.streak.upsert({
      where: { userId },
      create: { userId, currentStreak, longestStreak, lastCheckinDate: today },
      update: { currentStreak, longestStreak, lastCheckinDate: today },
    });

    await this.awardXp(userId, 10, XpSource.DAILY_CHECKIN);

    await this.prisma.activityTimeline.create({
      data: {
        userId,
        eventType: ActivityEventType.DAILY_CHECKIN,
        eventData: { streak: currentStreak, xpEarned: 10 },
      },
    });

    return {
      alreadyDone: false,
      xpEarned: 10,
      streak: currentStreak,
      message: `Check-in successful! Streak: ${currentStreak} days`,
    };
  }

  async getXpSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xpTotal: true, level: true },
    });

    const xpTotal = user?.xpTotal ?? 0;
    const level = user?.level ?? 1;
    const xpProgress = getXpProgress(xpTotal);
    const streak = await this.prisma.streak.findUnique({ where: { userId } });

    return {
      xpTotal,
      level,
      ...xpProgress,
      streak: {
        currentStreak: streak?.currentStreak ?? 0,
        longestStreak: streak?.longestStreak ?? 0,
        lastCheckinDate: streak?.lastCheckinDate ?? null,
      },
    };
  }

  async getStreak(userId: string) {
    const streak = await this.prisma.streak.findUnique({ where: { userId } });
    return (
      streak ?? {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckinDate: null,
      }
    );
  }

  async resetExpiredStreaks(): Promise<void> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    await this.prisma.streak.updateMany({
      where: {
        currentStreak: { gt: 0 },
        lastCheckinDate: { lt: yesterday },
      },
      data: { currentStreak: 0 },
    });
  }
}
