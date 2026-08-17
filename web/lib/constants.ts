/** Shared admin form options aligned with Prisma enums & seed data */

export const BADGE_TIERS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'GROWTH', label: 'Growth' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'SPECIAL', label: 'Special' },
] as const;

export const BADGE_CATEGORIES = [
  { value: 'milestones', label: 'Milestones' },
  { value: 'speaking', label: 'Speaking' },
  { value: 'streak', label: 'Streak' },
  { value: 'journal', label: 'Journal' },
  { value: 'fear', label: 'Fear' },
  { value: 'coach', label: 'Coach' },
  { value: 'missions', label: 'Missions' },
  { value: 'challenges', label: 'Challenges' },
  { value: 'social', label: 'Social' },
  { value: 'academic', label: 'Academic' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'xp', label: 'XP' },
] as const;

export const CONTENT_CATEGORIES = [
  { value: 'speaking', label: 'Speaking' },
  { value: 'social', label: 'Social' },
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'creative', label: 'Creative' },
] as const;

export const DIFFICULTIES = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
] as const;

export const SKILL_BRANCHES = [
  { value: 'speaking', label: 'Speaking' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'communication', label: 'Communication' },
] as const;

export const SKILL_TIERS = [1, 2, 3, 4, 5] as const;

export const PLATFORMS = [
  { value: 'IOS', label: 'iOS' },
  { value: 'ANDROID', label: 'Android' },
] as const;

export const ANNOUNCEMENT_TYPES = [
  { value: 'INFO', label: 'Info' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'UPDATE', label: 'Update' },
] as const;

export const FEAR_COLORS = [
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#A855F7', label: 'Purple' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#EF4444', label: 'Red' },
] as const;

export const selectClassName =
  'w-full h-9 rounded-md border border-input bg-background text-sm text-foreground px-3 focus:outline-none focus:ring-2 focus:ring-ring/40';

export const tierBadgeColors: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  GROWTH: 'bg-blue-100 text-blue-700 border-blue-200',
  ADVANCED: 'bg-violet-100 text-violet-700 border-violet-200',
  SPECIAL: 'bg-amber-100 text-amber-700 border-amber-200',
};

export const difficultyColors: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-orange-100 text-orange-700',
};

/** Parse newline- or comma-separated tips into string[] */
export function parseTips(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Paginated API list helper */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }
  return [];
}

export function unwrapPaginated<T>(payload: unknown): {
  items: T[];
  total: number;
  page: number;
  limit: number;
} {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    const items = (Array.isArray(obj.items)
      ? obj.items
      : Array.isArray(obj.data)
        ? obj.data
        : []) as T[];
    return {
      items,
      total: typeof obj.total === 'number' ? obj.total : items.length,
      page: typeof obj.page === 'number' ? obj.page : 1,
      limit: typeof obj.limit === 'number' ? obj.limit : items.length,
    };
  }
  return { items: [], total: 0, page: 1, limit: 20 };
}
