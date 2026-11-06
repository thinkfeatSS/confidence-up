import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { Badge } from '../types';
import { unwrapList, normalizeTier } from '../utils/apiHelpers';

const mapBadge = (b: any, earnedInfo?: { earnedAt?: string; isNew?: boolean }): Badge => ({
  id: b.id,
  name: b.name,
  description: b.description ?? '',
  icon: b.icon ?? '🏅',
  tier: normalizeTier(b.tier),
  earned: earnedInfo ? true : (b.earned ?? b.isEarned ?? b.isUnlocked ?? false),
  earnedAt: earnedInfo?.earnedAt ?? b.earnedAt ?? b.unlockedAt,
  isNew: earnedInfo?.isNew ?? b.isNew ?? false,
});

const fetchBadgesWithEarnedState = async (): Promise<Badge[]> => {
  const [allRes, mineRes] = await Promise.allSettled([
    apiClient.get<any, any>('/badges'),
    apiClient.get<any, any>('/badges/me'),
  ]);

  const all = allRes.status === 'fulfilled' ? unwrapList<any>(allRes.value) : [];
  const mine = mineRes.status === 'fulfilled' ? unwrapList<any>(mineRes.value) : [];

  const earnedMap = new Map<string, { earnedAt?: string; isNew?: boolean }>();
  for (const ub of mine) {
    const badgeId = ub?.badge?.id ?? ub?.badgeId ?? ub?.id;
    if (badgeId) {
      earnedMap.set(badgeId, { earnedAt: ub.unlockedAt ?? ub.earnedAt, isNew: ub.isNew });
    }
  }

  return all.map(b => mapBadge(b, earnedMap.get(b.id)));
};

export const useBadges = () =>
  useQuery({
    queryKey: ['badges'],
    queryFn: fetchBadgesWithEarnedState,
    staleTime: 5 * 60 * 1000,
  });

export const useEarnedBadges = () =>
  useQuery({
    queryKey: ['badges', 'earned'],
    queryFn: async (): Promise<Badge[]> => {
      const badges = await fetchBadgesWithEarnedState();
      return badges.filter(b => b.earned);
    },
    staleTime: 5 * 60 * 1000,
  });

export const useNewBadges = () =>
  useQuery({
    queryKey: ['badges', 'new'],
    queryFn: async (): Promise<Badge[]> => {
      const badges = await fetchBadgesWithEarnedState();
      return badges.filter(b => b.isNew);
    },
    staleTime: 60 * 1000,
  });
