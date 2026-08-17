import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { parseStreakValue, parseBestStreak } from '../utils/mapUserProfile';

export interface XpSummary {
  xpTotal: number;
  level: number;
  levelTitle: string;
  xpToNextLevel: number;
  progressPercent: number;
  weeklyXP: number;
}

export interface StreakInfo {
  current: number;
  best: number;
  shields: number;
  lastCheckinDate: string | null;
}

const fetchXpSummary = async (): Promise<XpSummary> => {
  const res = await apiClient.get<any, any>('/gamification/me/xp');
  const d = unwrapApiData<any>(res);
  const currentLevelXp = d.currentLevelXp ?? d.xp ?? 0;
  const nextLevelXp = d.nextLevelXp ?? d.xpToNextLevel ?? 100;
  return {
    xpTotal: d.xpTotal ?? d.totalXP ?? 0,
    level: d.level ?? d.currentLevel ?? 1,
    levelTitle: d.levelTitle ?? 'Newcomer',
    xpToNextLevel: nextLevelXp,
    progressPercent: d.progressPercent ?? Math.round((currentLevelXp / nextLevelXp) * 100),
    weeklyXP: d.weeklyXP ?? 0,
  };
};

const fetchStreak = async (): Promise<StreakInfo> => {
  const res = await apiClient.get<any, any>('/gamification/me/streak');
  const d = unwrapApiData<any>(res);
  return {
    current: parseStreakValue(d),
    best: parseBestStreak(d),
    shields: d.shields ?? d.streakShields ?? 0,
    lastCheckinDate: d.lastCheckinDate ?? null,
  };
};

export const useXpSummary = () =>
  useQuery({
    queryKey: ['gamification', 'xp'],
    queryFn: fetchXpSummary,
    staleTime: 2 * 60 * 1000,
  });

export const useStreak = () =>
  useQuery({
    queryKey: ['gamification', 'streak'],
    queryFn: fetchStreak,
    staleTime: 60 * 1000,
  });

export const useDailyCheckin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<{ xpEarned: number; streak: number }> => {
      const res = await apiClient.post<any, any>('/gamification/me/checkin');
      const d = unwrapApiData<any>(res);
      return {
        xpEarned: d.xpEarned ?? 0,
        streak: parseStreakValue(d.streak ?? d),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
};
