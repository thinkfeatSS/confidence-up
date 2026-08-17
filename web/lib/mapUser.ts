import {
  computeGrowthMetrics,
  mapGrowthMetricsFromApi,
  mapSpeechSessionFromApi,
  type GrowthMetrics,
  type WebSpeechSession,
} from '@/lib/mapSpeech';

const XP_LEVELS = [
  { level: 1, xpRequired: 0, title: 'Novice' },
  { level: 2, xpRequired: 100, title: 'Apprentice' },
  { level: 3, xpRequired: 300, title: 'Practitioner' },
  { level: 4, xpRequired: 600, title: 'Adept' },
  { level: 5, xpRequired: 1000, title: 'Expert' },
  { level: 6, xpRequired: 1500, title: 'Specialist' },
  { level: 7, xpRequired: 2200, title: 'Master' },
  { level: 8, xpRequired: 3000, title: 'Grandmaster' },
  { level: 9, xpRequired: 4000, title: 'Elite' },
  { level: 10, xpRequired: 5500, title: 'Legend' },
];

function getXpProgress(xpTotal: number, level: number) {
  const current = XP_LEVELS.find((l) => l.level === level) ?? XP_LEVELS[0];
  const next = XP_LEVELS.find((l) => l.level === level + 1);
  return {
    levelTitle: current.title,
    xp: Math.max(0, xpTotal - current.xpRequired),
    xpToNextLevel: next ? next.xpRequired - current.xpRequired : 100,
  };
}

export function parseStreakValue(streak: unknown): number {
  if (typeof streak === 'number') return streak;
  if (streak && typeof streak === 'object') {
    const obj = streak as Record<string, unknown>;
    if ('currentStreak' in obj) return Number(obj.currentStreak) || 0;
    if ('current' in obj) return Number(obj.current) || 0;
    if ('streakDays' in obj) return Number(obj.streakDays) || 0;
  }
  return 0;
}

export function parseBestStreak(streak: unknown): number {
  if (typeof streak === 'number') return streak;
  if (streak && typeof streak === 'object') {
    const obj = streak as Record<string, unknown>;
    if ('longestStreak' in obj) return Number(obj.longestStreak) || 0;
    if ('best' in obj) return Number(obj.best) || 0;
    if ('bestStreak' in obj) return Number(obj.bestStreak) || 0;
  }
  return 0;
}

export type WebUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  level: number;
  levelTitle: string;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  streak: number;
  confidenceScore: number;
  confidenceAreas: { area: string; score: number }[];
  totalSpeeches: number;
  totalChallenges: number;
  referralCode?: string;
};

export function mapUserFromApi(d: Record<string, unknown>): WebUser {
  const streakRaw = d.streak;
  const level = (d.level as number) ?? 1;
  const totalXP = (d.xpTotal as number) ?? (d.totalXP as number) ?? 0;
  const xpProgress = getXpProgress(totalXP, level);
  const challengeCount =
    (d._count as { userChallenges?: number })?.userChallenges ??
    (d.totalChallenges as number) ??
    (d.completedChallenges as number) ??
    0;

  return {
    id: d.id as string,
    name: d.name as string,
    email: d.email as string,
    role: (d.role as string) ?? 'USER',
    level,
    levelTitle: (d.levelTitle as string) ?? xpProgress.levelTitle,
    xp: (d.xp as number) ?? xpProgress.xp,
    xpToNextLevel: (d.xpToNextLevel as number) ?? xpProgress.xpToNextLevel,
    totalXP,
    streak: parseStreakValue(streakRaw),
    confidenceScore: Math.round(
      (d.confidenceScore as number) ?? (d.avgConfidenceScore as number) ?? 0,
    ),
    confidenceAreas: (d.confidenceAreas as WebUser['confidenceAreas']) ?? [],
    totalSpeeches:
      (d._count as { speechSessions?: number })?.speechSessions ??
      (d.totalSpeeches as number) ??
      0,
    totalChallenges: typeof challengeCount === 'number' ? challengeCount : 0,
    referralCode: d.referralCode as string | undefined,
  };
}

export type DailyScore = { date: string; score: number };

export type UserProgress = {
  totalXP: number;
  weeklyXP: number;
  bestStreak: number;
  totalSpeeches: number;
  totalChallenges: number;
  averageScore: number;
  confidenceHistory: DailyScore[];
  speechSessions: WebSpeechSession[];
  growthMetrics?: GrowthMetrics;
};

export function mapProgressFromApi(
  summary: Record<string, unknown>,
  progress: Record<string, unknown>,
  user: Record<string, unknown>,
  streak: Record<string, unknown>,
  speechItems: Record<string, unknown>[],
): UserProgress {
  const timeline = (progress.confidenceTimeline as Record<string, unknown>[]) ?? [];

  const speechSessions = speechItems.map((item) => mapSpeechSessionFromApi(item));
  const streakDays = parseStreakValue(streak);
  const growthMetrics =
    mapGrowthMetricsFromApi(progress.growthMetrics) ??
    computeGrowthMetrics(speechSessions, streakDays);

  return {
    totalXP: (user.xpTotal as number) ?? 0,
    weeklyXP: (summary.xpEarned as number) ?? 0,
    bestStreak: parseBestStreak(streak),
    totalSpeeches:
      (user._count as { speechSessions?: number })?.speechSessions ??
      speechSessions.length ??
      (summary.speechSessions as number) ??
      0,
    totalChallenges:
      (user._count as { userChallenges?: number })?.userChallenges ??
      (user.totalChallenges as number) ??
      0,
    averageScore: Math.round(
      (summary.averageConfidenceScore as number) ??
        (user.confidenceScore as number) ??
        0,
    ),
    confidenceHistory: timeline.map((d) => ({
      date:
        typeof d.date === 'string'
          ? d.date.split('T')[0]
          : String(d.date ?? ''),
      score: Math.round(
        (d.overallConfidenceScore as number) ?? (d.score as number) ?? 0,
      ),
    })),
    speechSessions,
    growthMetrics,
  };
}

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
};
