'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { parseStreakValue, parseBestStreak } from '@/lib/mapUser';

export function useReferralCode() {
  return useQuery({
    queryKey: ['referral'],
    queryFn: async () => {
      const res = await api.get('/referral/me/code');
      const data = res.data as Record<string, unknown>;
      return (data.referralCode as string) ?? (data.code as string) ?? '';
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useStreak() {
  return useQuery({
    queryKey: ['gamification', 'streak'],
    queryFn: async () => {
      const res = await api.get('/gamification/me/streak');
      const d = res.data as Record<string, unknown>;
      return {
        current: parseStreakValue(d),
        best: parseBestStreak(d),
      };
    },
    staleTime: 60 * 1000,
  });
}
