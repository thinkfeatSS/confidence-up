import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';
import { ConfidenceArea } from '../types';
import { unwrapList, mapSpeechSessionFromApi } from '../utils/apiHelpers';
import { useAuth } from '../context/AuthContext';
import { useUser } from './useUser';

export interface EnhancedConfidenceArea extends ConfidenceArea {
  emoji: string;
  categoryKey: string;
}

export interface ConfidenceAreasResult {
  areas: EnhancedConfidenceArea[];
  hasSpeechData: boolean;
  averageScore: number;
  topStrength?: string;
  focusArea?: string;
}

const DEFAULT_AREAS_CONFIG = [
  { name: 'Fluency & Pacing', key: 'speechFluencyScore', emoji: '🌊', defaultScore: 72 },
  { name: 'Pronunciation Clarity', key: 'pronunciationScore', emoji: '🎙️', defaultScore: 75 },
  { name: 'Topic & Argument', key: 'topicRelevanceScore', emoji: '🎯', defaultScore: 74 },
  { name: 'Vocabulary Richness', key: 'vocabularyScore', emoji: '📚', defaultScore: 70 },
  { name: 'Structure & Coherence', key: 'structureScore', emoji: '🏛️', defaultScore: 68 },
  { name: 'Practice Consistency', key: 'practiceConsistencyScore', emoji: '🔥', defaultScore: 65 },
];

export const useConfidenceAreas = () => {
  const { isAuthenticated } = useAuth();
  const { data: user } = useUser();

  return useQuery({
    queryKey: ['confidence-areas', user?.id],
    queryFn: async (): Promise<ConfidenceAreasResult> => {
      try {
        const res = await apiClient.get<any, any>('/speech/sessions', { params: { page: 1, limit: 15 } });
        const items = unwrapList<any>(res);
        const sessions = items.map((s) => mapSpeechSessionFromApi(s));

        if (sessions.length > 0) {
          // Calculate average component scores across recent sessions
          const areaSums: Record<string, { total: number; count: number }> = {};
          DEFAULT_AREAS_CONFIG.forEach((cfg) => {
            areaSums[cfg.key] = { total: 0, count: 0 };
          });

          sessions.forEach((s) => {
            const comps = s.components as any;
            if (comps) {
              if (comps.speechFluencyScore !== undefined) {
                areaSums.speechFluencyScore.total += comps.speechFluencyScore;
                areaSums.speechFluencyScore.count += 1;
              } else if (s.clarityScore !== undefined) {
                areaSums.speechFluencyScore.total += s.clarityScore;
                areaSums.speechFluencyScore.count += 1;
              }

              if (comps.pronunciationScore !== undefined) {
                areaSums.pronunciationScore.total += comps.pronunciationScore;
                areaSums.pronunciationScore.count += 1;
              } else {
                areaSums.pronunciationScore.total += 80;
                areaSums.pronunciationScore.count += 1;
              }

              if (comps.topicRelevanceScore !== undefined) {
                areaSums.topicRelevanceScore.total += comps.topicRelevanceScore;
                areaSums.topicRelevanceScore.count += 1;
              } else if (s.toneScore !== undefined) {
                areaSums.topicRelevanceScore.total += s.toneScore;
                areaSums.topicRelevanceScore.count += 1;
              }

              if (comps.vocabularyScore !== undefined) {
                areaSums.vocabularyScore.total += comps.vocabularyScore;
                areaSums.vocabularyScore.count += 1;
              }

              if (comps.structureScore !== undefined) {
                areaSums.structureScore.total += comps.structureScore;
                areaSums.structureScore.count += 1;
              }

              if (comps.practiceConsistencyScore !== undefined) {
                areaSums.practiceConsistencyScore.total += comps.practiceConsistencyScore;
                areaSums.practiceConsistencyScore.count += 1;
              }
            }
          });

          const areas: EnhancedConfidenceArea[] = DEFAULT_AREAS_CONFIG.map((cfg) => {
            const entry = areaSums[cfg.key];
            const avg = entry && entry.count > 0 ? Math.round(entry.total / entry.count) : cfg.defaultScore;
            return {
              name: cfg.name,
              score: Math.max(10, Math.min(100, avg)),
              emoji: cfg.emoji,
              categoryKey: cfg.key,
            };
          });

          const sorted = [...areas].sort((a, b) => b.score - a.score);
          const averageScore = Math.round(areas.reduce((acc, a) => acc + a.score, 0) / areas.length);

          return {
            areas,
            hasSpeechData: true,
            averageScore,
            topStrength: sorted[0]?.name,
            focusArea: sorted[sorted.length - 1]?.name,
          };
        }
      } catch {
        // Fallback to baseline
      }

      // Baseline profile calculated from user's level and confidence score
      const baseModifier = Math.min(15, Math.floor((user?.level ?? 1) * 2));
      const userConfidence = user?.confidenceScore ? Math.round(user.confidenceScore) : null;

      const areas: EnhancedConfidenceArea[] = DEFAULT_AREAS_CONFIG.map((cfg) => {
        const score = userConfidence
          ? Math.max(40, Math.min(95, Math.round(userConfidence + (cfg.defaultScore - 70))))
          : Math.min(95, cfg.defaultScore + baseModifier);
        return {
          name: cfg.name,
          score,
          emoji: cfg.emoji,
          categoryKey: cfg.key,
        };
      });

      const sorted = [...areas].sort((a, b) => b.score - a.score);
      const averageScore = Math.round(areas.reduce((acc, a) => acc + a.score, 0) / areas.length);

      return {
        areas,
        hasSpeechData: false,
        averageScore,
        topStrength: sorted[0]?.name,
        focusArea: sorted[sorted.length - 1]?.name,
      };
    },
    staleTime: 2 * 60 * 1000,
    enabled: isAuthenticated,
  });
};
