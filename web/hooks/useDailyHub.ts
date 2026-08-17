'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type DailyHubMission = {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  difficulty: string;
  xpReward: number;
  userStatus?: { completedAt?: string | null };
};

export type DailyHubChallenge = {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  xpReward: number;
  userStatus?: { completed?: boolean };
};

export type DailyHub = {
  date: string;
  tip: string;
  streak: number;
  longestStreak: number;
  mission: DailyHubMission | null;
  missionCompleted: boolean;
  challenge: DailyHubChallenge | null;
  stats: {
    missionsCompletedToday: number;
    dailyGoalMet: boolean;
  };
};

export function useDailyHub() {
  return useQuery({
    queryKey: ['daily', 'hub'],
    queryFn: async () => {
      const res = await api.get<DailyHub>('/daily/hub');
      return res.data;
    },
    staleTime: 60_000,
  });
}
