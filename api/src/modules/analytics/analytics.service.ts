import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProgress(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [
      confidenceSessions,
      recentSessions,
      growthSessions,
      streak,
      completedMissions,
      completedThisWeek,
      fearLevels,
      userFearProgress,
    ] = await Promise.all([
      this.prisma.speechSession.findMany({
        where: { userId, createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, overallConfidenceScore: true },
        orderBy: { createdAt: 'asc' },
        take: 30,
      }),
      this.prisma.speechSession.findMany({
        where: { userId, createdAt: { gte: eightWeeksAgo } },
        select: { createdAt: true, overallConfidenceScore: true },
      }),
      this.prisma.speechSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          overallConfidenceScore: true,
          vocabularyRichness: true,
          speechSpeedWpm: true,
          fillerCount: true,
          pauseFrequency: true,
          fluencyScore: true,
          confidenceComponents: true,
        },
      }),
      this.prisma.streak.findUnique({ where: { userId } }),
      this.prisma.userMission.count({
        where: { userId, completedAt: { not: null } },
      }),
      this.prisma.userMission.count({
        where: { userId, completedAt: { gte: weekStart } },
      }),
      this.prisma.fearLevel.count(),
      this.prisma.userFearProgress.count({ where: { userId } }),
    ]);

    const confidenceTimeline = confidenceSessions.map((s) => ({
      date: s.createdAt,
      overallConfidenceScore: s.overallConfidenceScore,
    }));

    const weekMap = new Map<string, { sum: number; count: number }>();
    for (const s of recentSessions) {
      const weekKey = this.getWeekKey(s.createdAt);
      const entry = weekMap.get(weekKey) ?? { sum: 0, count: 0 };
      entry.sum += s.overallConfidenceScore;
      entry.count += 1;
      weekMap.set(weekKey, entry);
    }
    const speechTrend = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, { sum, count }]) => ({
        week,
        avgConfidenceScore: Math.round((sum / count) * 100) / 100,
      }));

    const growthMetrics = this.buildGrowthMetrics(
      growthSessions,
      streak?.currentStreak ?? 0,
    );

    return {
      confidenceTimeline,
      speechTrend,
      growthMetrics,
      missionStats: {
        total: completedMissions,
        thisWeek: completedThisWeek,
      },
      fearProgress: {
        total: fearLevels,
        completed: userFearProgress,
      },
    };
  }

  async getUserSummary(userId: string, period: 'week' | 'month') {
    const since = new Date();
    if (period === 'week') {
      since.setDate(since.getDate() - 7);
    } else {
      since.setMonth(since.getMonth() - 1);
    }

    const [xpAgg, missionsCompleted, speechAgg, badgesEarned, streak] = await Promise.all([
      this.prisma.xpTransaction.aggregate({
        where: { userId, createdAt: { gte: since } },
        _sum: { amount: true },
      }),
      this.prisma.userMission.count({
        where: { userId, completedAt: { gte: since } },
      }),
      this.prisma.speechSession.aggregate({
        where: { userId, createdAt: { gte: since } },
        _count: { id: true },
        _avg: { overallConfidenceScore: true },
      }),
      this.prisma.userBadge.count({
        where: { userId, earnedAt: { gte: since } },
      }),
      this.prisma.streak.findUnique({ where: { userId } }),
    ]);

    return {
      xpEarned: xpAgg._sum.amount ?? 0,
      missionsCompleted,
      speechSessions: speechAgg._count.id,
      averageConfidenceScore:
        Math.round((speechAgg._avg.overallConfidenceScore ?? 0) * 100) / 100,
      streakDays: streak?.currentStreak ?? 0,
      badgesEarned,
    };
  }

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsers,
      activeTodayRows,
      newUsersThisWeek,
      totalMissionsCompleted,
      speechAgg,
      topBadgesRaw,
      growthUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.dailyCheckin.findMany({
        where: { date: { gte: today, lt: tomorrow } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.userMission.count({ where: { completedAt: { not: null } } }),
      this.prisma.speechSession.aggregate({
        _count: { id: true },
        _avg: { overallConfidenceScore: true },
      }),
      this.prisma.userBadge.groupBy({
        by: ['badgeId'],
        _count: { badgeId: true },
        orderBy: { _count: { badgeId: 'desc' } },
        take: 5,
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),
    ]);

    const badgeIds = topBadgesRaw.map((b) => b.badgeId);
    const badges = await this.prisma.badge.findMany({
      where: { id: { in: badgeIds } },
      select: { id: true, name: true, icon: true },
    });
    const badgeMap = new Map(badges.map((b) => [b.id, b]));
    const topBadges = topBadgesRaw.map((b) => ({
      badge: badgeMap.get(b.badgeId),
      count: b._count.badgeId,
    }));

    const growthMap = new Map<string, number>();
    for (const u of growthUsers) {
      const dateKey = u.createdAt.toISOString().split('T')[0];
      growthMap.set(dateKey, (growthMap.get(dateKey) ?? 0) + 1);
    }
    const userGrowth = Array.from(growthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      totalUsers,
      activeToday: activeTodayRows.length,
      newUsersThisWeek,
      totalMissionsCompleted,
      totalSpeechSessions: speechAgg._count.id,
      avgConfidenceScore: Math.round((speechAgg._avg.overallConfidenceScore ?? 0) * 100) / 100,
      topBadges,
      userGrowth,
    };
  }

  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  }

  private percentChange(current: number, baseline: number) {
    if (!baseline) return 0;
    return Math.round(((current - baseline) / baseline) * 100);
  }

  private average(values: number[]) {
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
  }

  private buildGrowthMetrics(
    sessions: Array<{
      createdAt: Date;
      overallConfidenceScore: number;
      vocabularyRichness: number;
      speechSpeedWpm: number;
      fillerCount: number;
      pauseFrequency: number;
      fluencyScore: number;
      confidenceComponents: unknown;
    }>,
    streakDays: number,
  ) {
    const recent = sessions.slice(-7);
    const baseline = sessions.slice(0, 7);
    const scores = sessions.map((session) => session.overallConfidenceScore);

    const pickComponent = (session: (typeof sessions)[number], key: string) => {
      const components = session.confidenceComponents as Record<string, number> | null;
      if (components && typeof components[key] === 'number') return components[key];
      if (key === 'speechFluencyScore') return session.fluencyScore;
      return 0;
    };

    const buildTrend = (pick: (session: (typeof sessions)[number]) => number) =>
      sessions.slice(-14).map((session) => ({
        date: session.createdAt.toISOString().split('T')[0],
        value: pick(session),
      }));

    const currentVocab = this.average(recent.map((session) => session.vocabularyRichness));
    const baselineVocab = this.average(baseline.map((session) => session.vocabularyRichness));
    const currentWpm = this.average(recent.map((session) => session.speechSpeedWpm));
    const baselineWpm = this.average(baseline.map((session) => session.speechSpeedWpm));
    const currentFillers = this.average(recent.map((session) => session.fillerCount));
    const baselineFillers = this.average(baseline.map((session) => session.fillerCount));
    const currentPauses = this.average(recent.map((session) => session.pauseFrequency));
    const baselinePauses = this.average(baseline.map((session) => session.pauseFrequency));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sessionsLast30Days = sessions.filter(
      (session) => session.createdAt >= thirtyDaysAgo,
    ).length;

    return {
      confidence: {
        best: scores.length ? Math.max(...scores) : 0,
        average: this.average(scores),
        growthPercent: this.percentChange(
          this.average(recent.map((session) => session.overallConfidenceScore)),
          this.average(baseline.map((session) => session.overallConfidenceScore)),
        ),
        trend: buildTrend((session) => session.overallConfidenceScore),
      },
      vocabulary: {
        uniqueWordsNow: Math.round(currentVocab),
        uniqueWordsBaseline: Math.round(baselineVocab),
        growthPercent: this.percentChange(currentVocab, baselineVocab),
      },
      wpm: {
        current: Math.round(currentWpm),
        baseline: Math.round(baselineWpm),
        changePercent: this.percentChange(currentWpm, baselineWpm),
      },
      fillers: {
        current: Math.round(currentFillers),
        baseline: Math.round(baselineFillers),
        reductionPercent: baselineFillers
          ? Math.round(((baselineFillers - currentFillers) / baselineFillers) * 100)
          : 0,
      },
      pauses: {
        current: currentPauses,
        baseline: baselinePauses,
        reductionPercent: baselinePauses
          ? Math.round(((baselinePauses - currentPauses) / baselinePauses) * 100)
          : 0,
      },
      components: {
        fluency: buildTrend((session) => pickComponent(session, 'speechFluencyScore')),
        structure: buildTrend((session) => pickComponent(session, 'structureScore')),
        energy: buildTrend((session) => pickComponent(session, 'energyScore')),
        vocabulary: buildTrend((session) => pickComponent(session, 'vocabularyScore')),
      },
      consistency: {
        streakDays,
        sessionsLast7Days: recent.length,
        sessionsLast30Days,
      },
    };
  }
}
