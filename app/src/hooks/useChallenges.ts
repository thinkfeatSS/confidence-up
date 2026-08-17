import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { Challenge, Category, Difficulty } from '../types';
import {
  unwrapList,
  normalizeDifficulty,
  normalizeCategory,
  toApiDifficulty,
  parseTips,
} from '../utils/apiHelpers';

const mapChallenge = (c: any): Challenge => ({
  id: c.id,
  title: c.title,
  description: c.description,
  whyItHelps: c.whyItHelps ?? c.description ?? '',
  category: normalizeCategory(c.category),
  difficulty: normalizeDifficulty(c.difficulty),
  xpReward: c.xpReward ?? 0,
  tips: parseTips(c.tips),
  completed: c.userStatus?.completed ?? c.completed ?? false,
  completedAt: c.userStatus?.completedAt ?? c.completedAt,
});

const fetchChallenges = async (
  category?: Category | 'all',
  difficulty?: Difficulty | 'all',
): Promise<Challenge[]> => {
  const params: Record<string, string | number> = { page: 1, limit: 100 };
  if (category && category !== 'all') params.category = category;
  const apiDiff = toApiDifficulty(difficulty ?? 'all');
  if (apiDiff) params.difficulty = apiDiff;

  const res = await apiClient.get<any, any>('/challenges', { params });
  return unwrapList<any>(res).map(mapChallenge);
};

export const useChallenges = (category?: Category | 'all', difficulty?: Difficulty | 'all') => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['challenges', category, difficulty],
    queryFn: () => fetchChallenges(category, difficulty),
    placeholderData: () => {
      const cached = queryClient.getQueryData<Challenge[]>(['challenges']);
      if (!cached) return undefined;
      return cached.filter(c => {
        const catOk = !category || category === 'all' || c.category === category;
        const diffOk = !difficulty || difficulty === 'all' || c.difficulty === difficulty;
        return catOk && diffOk;
      });
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useCompleteChallenge = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (challengeId: string): Promise<string> => {
      await apiClient.post(`/challenges/${challengeId}/complete`);
      return challengeId;
    },
    onSuccess: (challengeId) => {
      queryClient.getQueriesData<Challenge[]>({ queryKey: ['challenges'] }).forEach(([key, data]) => {
        if (data) {
          queryClient.setQueryData<Challenge[]>(
            key,
            data.map(c =>
              c.id === challengeId
                ? { ...c, completed: true, completedAt: new Date().toISOString() }
                : c,
            ),
          );
        }
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['daily', 'hub'] });
    },
  });
};
