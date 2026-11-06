import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { Fear, FearLevel } from '../types';
import { unwrapList } from '../utils/apiHelpers';

const buildFears = (categories: any[], completedIds: Set<string>): Fear[] =>
  categories.map(cat => {
    const levels: FearLevel[] = (cat.fearLevels ?? cat.levels ?? []).map((l: any) => ({
      id: l.id,
      level: l.levelNumber ?? l.level ?? 0,
      title: l.title,
      description: l.description,
      tips: Array.isArray(l.tips) ? l.tips : [],
      xpReward: l.xpReward ?? 0,
      completed: l.isCompleted === true || completedIds.has(l.id),
    }));

    const firstIncomplete = levels.find((l: FearLevel) => !l.completed);
    const currentLevel = firstIncomplete
      ? firstIncomplete.level
      : levels.length > 0
        ? levels[levels.length - 1].level
        : 0;

    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon ?? '😰',
      color: cat.color ?? '#7C3AED',
      currentLevel,
      levels,
    };
  });

const fetchFears = async (): Promise<Fear[]> => {
  const [catalogRes, progressRes] = await Promise.all([
    apiClient.get<any, any>('/fears'),
    apiClient.get<any, any>('/fears/me'),
  ]);

  const categories = unwrapList<any>(catalogRes);
  const progressList = unwrapList<any>(progressRes);
  const completedIds = new Set<string>();

  for (const item of progressList) {
    if (typeof item === 'string') {
      completedIds.add(item);
    } else if (item && typeof item === 'object') {
      const id = item.fearLevelId ?? item.id;
      if (id) completedIds.add(String(id));
    }
  }

  return buildFears(categories, completedIds);
};

export const useFears = () =>
  useQuery({ queryKey: ['fears'], queryFn: fetchFears, staleTime: 5 * 60 * 1000 });

export const useCompleteFearLevel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fearLevelId,
    }: {
      fearId: string;
      level: number;
      fearLevelId: string;
    }): Promise<string> => {
      await apiClient.post(`/fears/me/${fearLevelId}/complete`);
      return fearLevelId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fears'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
};
