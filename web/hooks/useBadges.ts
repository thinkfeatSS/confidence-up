import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Badge } from '@/lib/mapUser';

function unwrapList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'items' in data) {
    return (data as { items: Record<string, unknown>[] }).items ?? [];
  }
  return [];
}

async function fetchBadges(): Promise<Badge[]> {
  const [allRes, mineRes] = await Promise.all([
    api.get('/badges'),
    api.get('/badges/me'),
  ]);

  const all = unwrapList(allRes.data);
  const mine = unwrapList(mineRes.data);

  const earnedIds = new Set<string>();
  const earnedAtMap = new Map<string, string>();
  for (const ub of mine) {
    const badgeId =
      (ub.badge as { id?: string })?.id ?? (ub.badgeId as string) ?? (ub.id as string);
    earnedIds.add(badgeId);
    if (ub.earnedAt) earnedAtMap.set(badgeId, ub.earnedAt as string);
  }

  return all.map((b) => ({
    id: b.id as string,
    name: b.name as string,
    description: (b.description as string) ?? '',
    icon: (b.icon as string) ?? '🏅',
    earned: earnedIds.has(b.id as string),
    earnedAt: earnedAtMap.get(b.id as string),
  }));
}

export function useBadges() {
  return useQuery({
    queryKey: ['badges'],
    queryFn: fetchBadges,
    staleTime: 5 * 60 * 1000,
  });
}
