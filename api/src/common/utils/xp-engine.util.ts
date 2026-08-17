export const XP_LEVELS: { level: number; xpRequired: number; title: string }[] =
  [
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

export function calculateLevel(xpTotal: number): number {
  let level = 1;
  for (const entry of XP_LEVELS) {
    if (xpTotal >= entry.xpRequired) {
      level = entry.level;
    } else {
      break;
    }
  }
  return level;
}

export function getLevelInfo(level: number) {
  return XP_LEVELS.find((l) => l.level === level) ?? XP_LEVELS[0];
}

export function getNextLevelInfo(level: number) {
  return XP_LEVELS.find((l) => l.level === level + 1) ?? null;
}

export function getXpProgress(xpTotal: number): {
  currentLevel: number;
  levelTitle: string;
  currentLevelXp: number;
  nextLevelXp: number | null;
  progressPercent: number;
} {
  const level = calculateLevel(xpTotal);
  const current = getLevelInfo(level);
  const next = getNextLevelInfo(level);

  const currentLevelXp = xpTotal - current.xpRequired;
  const nextLevelXp = next ? next.xpRequired - current.xpRequired : null;
  const progressPercent = nextLevelXp
    ? Math.min(100, Math.floor((currentLevelXp / nextLevelXp) * 100))
    : 100;

  return {
    currentLevel: level,
    levelTitle: current.title,
    currentLevelXp,
    nextLevelXp,
    progressPercent,
  };
}
