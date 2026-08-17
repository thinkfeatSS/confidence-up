import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { Mission, Challenge } from '../types';
import {
  normalizeDifficulty,
  normalizeCategory,
  parseTips,
} from '../utils/apiHelpers';
import { mapMission } from './useMissions';

export type DailyHub = {
  date: string;
  tip: string;
  streak: number;
  longestStreak: number;
  xpTotal: number;
  level: number;
  mission: Mission | null;
  missionCompleted: boolean;
  challenge: Challenge | null;
  stats: {
    missionsCompletedToday: number;
    dailyGoalMet: boolean;
  };
};

const mapChallenge = (c: any): Challenge => ({
  id: c.id,
  title: c.title,
  description: c.description,
  whyItHelps: c.whyItHelps ?? c.description ?? '',
  category: normalizeCategory(c.category),
  difficulty: normalizeDifficulty(c.difficulty),
  xpReward: c.xpReward ?? 0,
  tips: parseTips(c.tips),
  completed: !!c.userStatus?.completed,
  completedAt: c.userStatus?.completedAt,
});

const fetchDailyHub = async (): Promise<DailyHub> => {
  const res = await apiClient.get<any, any>('/daily/hub');
  const data = unwrapApiData<any>(res);

  const mission = data.mission
    ? mapMission(data.mission, { isDaily: true, date: data.date })
    : null;

  const challenge = data.challenge ? mapChallenge(data.challenge) : null;

  return {
    date: data.date,
    tip: data.tip ?? '',
    streak: data.streak ?? 0,
    longestStreak: data.longestStreak ?? 0,
    xpTotal: data.xpTotal ?? 0,
    level: data.level ?? 1,
    mission,
    missionCompleted: data.missionCompleted ?? false,
    challenge,
    stats: data.stats ?? { missionsCompletedToday: 0, dailyGoalMet: false },
  };
};

export const useDailyHub = () =>
  useQuery({
    queryKey: ['daily', 'hub'],
    queryFn: fetchDailyHub,
    staleTime: 60 * 1000,
  });
