import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { ConfidenceArea } from '../types';
import { mapSpeechSessionFromApi } from '../utils/apiHelpers';

import { useAuth } from '../context/AuthContext';

const AREA_MAP: Array<{ name: string; key: string }> = [
  { name: 'Fluency', key: 'speechFluencyScore' },
  { name: 'Vocabulary', key: 'vocabularyScore' },
  { name: 'Structure', key: 'structureScore' },
  { name: 'Topic', key: 'topicRelevanceScore' },
  { name: 'Energy', key: 'energyScore' },
  { name: 'Consistency', key: 'practiceConsistencyScore' },
];

export const useConfidenceAreas = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['confidence-areas'],
    queryFn: async (): Promise<ConfidenceArea[]> => {
      const res = await apiClient.get<any, any>('/speech/sessions', { params: { page: 1, limit: 1 } });
      const payload = unwrapApiData<{ items?: any[]; data?: any[] }>(res);
      const items = payload.items ?? payload.data ?? (Array.isArray(payload) ? payload : []);
      if (!items.length) return [];

      const session = mapSpeechSessionFromApi(items[0], items[0].topic ?? '');
      const components = session.components ?? (items[0].confidenceComponents as Record<string, number> | undefined);
      if (!components) return [];

      return AREA_MAP.map(area => ({
        name: area.name,
        score: Math.round(Number(components[area.key as keyof typeof components] ?? 0)),
      })).filter(area => area.score > 0);
    },
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
};
