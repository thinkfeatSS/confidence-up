import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { Mission } from '../types';
import {
  unwrapList,
  normalizeDifficulty,
  normalizeCategory,
  parseTips,
} from '../utils/apiHelpers';

export const mapMission = (m: any, extras?: { isDaily?: boolean; date?: string }): Mission => ({
  id: m.id,
  title: m.title,
  description: m.description,
  whyItHelps: m.whyItHelps ?? m.description ?? '',
  category: normalizeCategory(m.category),
  difficulty: normalizeDifficulty(m.difficulty),
  xpReward: m.xpReward ?? 0,
  tips: parseTips(m.tips),
  completed: !!m.userStatus?.completedAt || m.completed === true,
  completedAt: m.userStatus?.completedAt ?? m.completedAt,
  prompt: m.prompt ?? '',
  isDaily: extras?.isDaily ?? m.isDaily ?? false,
  date: extras?.date ?? m.date ?? new Date().toISOString().split('T')[0],
});

const fetchMissions = async (): Promise<Mission[]> => {
  const res = await apiClient.get<any, any>('/missions', { params: { page: 1, limit: 100 } });
  return unwrapList<any>(res).map(m => mapMission(m));
};

const fetchTodaysMission = async (): Promise<Mission | null> => {
  const res = await apiClient.get<any, any>('/missions/today');
  const daily = unwrapApiData<any>(res);
  if (!daily?.mission) return null;

  const dateStr =
    typeof daily.date === 'string'
      ? daily.date.split('T')[0]
      : new Date().toISOString().split('T')[0];

  return mapMission(daily.mission, { isDaily: true, date: dateStr });
};

export const useMissions = () =>
  useQuery({
    queryKey: ['missions'],
    queryFn: fetchMissions,
    staleTime: 2 * 60 * 1000,
  });

export const useTodaysMission = () =>
  useQuery({
    queryKey: ['missions', 'today'],
    queryFn: fetchTodaysMission,
    staleTime: 60 * 1000,
  });

export const useCompleteMission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (missionId: string): Promise<string> => {
      await apiClient.post(`/missions/${missionId}/complete`);
      return missionId;
    },
    onSuccess: (missionId) => {
      queryClient.setQueryData<Mission[]>(['missions'], old =>
        old?.map(m =>
          m.id === missionId ? { ...m, completed: true, completedAt: new Date().toISOString() } : m,
        ),
      );
      queryClient.setQueryData<Mission | null>(['missions', 'today'], old =>
        old?.id === missionId ? { ...old, completed: true } : old,
      );
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['daily', 'hub'] });
    },
  });
};
