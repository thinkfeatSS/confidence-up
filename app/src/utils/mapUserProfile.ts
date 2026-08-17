import { User } from '../types';

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
  const current = XP_LEVELS.find(l => l.level === level) ?? XP_LEVELS[0];
  const next = XP_LEVELS.find(l => l.level === level + 1);
  return {
    levelTitle: current.title,
    xp: Math.max(0, xpTotal - current.xpRequired),
    xpToNextLevel: next ? next.xpRequired - current.xpRequired : 100,
  };
}

/** Normalize streak from API — may be a number or nested Streak record */
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

export function mapUserFromApi(d: Record<string, any>): User {
  const streakRaw = d.streak;
  const level = d.level ?? 1;
  const totalXP = d.xpTotal ?? d.totalXP ?? 0;
  const xpProgress = getXpProgress(totalXP, level);
  const challengeCount =
    d._count?.userChallenges ?? d.totalChallenges ?? d.completedChallenges ?? 0;

  return {
    id: d.id,
    name: d.name,
    email: d.email,
    avatar: d.avatarUrl,
    level,
    levelTitle: d.levelTitle ?? xpProgress.levelTitle,
    xp: d.xp ?? d.xpProgress?.current ?? xpProgress.xp,
    xpToNextLevel: d.xpToNextLevel ?? d.xpProgress?.needed ?? xpProgress.xpToNextLevel,
    totalXP,
    streak: parseStreakValue(streakRaw),
    streakShields: d.streakShields ?? 0,
    confidenceScore: Math.round(d.confidenceScore ?? d.avgConfidenceScore ?? 0),
    confidenceAreas: d.confidenceAreas ?? [],
    preferredLanguages: Array.isArray(d.preferredLanguages) ? d.preferredLanguages : [],
    fears: d.onboardingFears ?? d.fears ?? [],
    totalSpeeches: d._count?.speechSessions ?? d.totalSpeeches ?? 0,
    totalChallenges: typeof challengeCount === 'number' ? challengeCount : 0,
    joinedAt: d.createdAt ?? d.joinedAt ?? '',
  };
}
