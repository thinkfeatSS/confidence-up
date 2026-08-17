import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { UserProgress, DailyScore, SpeechSession } from '../types';
import { parseBestStreak } from '../utils/mapUserProfile';
import { unwrapList, mapSpeechSessionFromApi } from '../utils/apiHelpers';
import { computeGrowthMetrics } from '../modules/speech/intelligence/growthAnalytics';
import { GrowthMetrics } from '../modules/speech/types/speechAnalysis.types';

const fetchSpeechSessions = async (): Promise<SpeechSession[]> => {
  const res = await apiClient.get<any, any>('/speech/sessions', { params: { page: 1, limit: 50 } });
  return unwrapList<any>(res).map(s => mapSpeechSessionFromApi(s));
};

const fetchProgress = async (): Promise<UserProgress> => {
  const [summaryRes, progressRes, userRes, streakRes, speechRes] = await Promise.all([
    apiClient.get<any, any>('/analytics/me/summary'),
    apiClient.get<any, any>('/analytics/me/progress'),
    apiClient.get<any, any>('/users/me'),
    apiClient.get<any, any>('/gamification/me/streak'),
    apiClient.get<any, any>('/speech/sessions', { params: { page: 1, limit: 50 } }),
  ]);

  const s = unwrapApiData<any>(summaryRes);
  const p = unwrapApiData<any>(progressRes);
  const u = unwrapApiData<any>(userRes);
  const streak = unwrapApiData<any>(streakRes);
  const speechItems = unwrapList<any>(speechRes);
  const speechSessions = speechItems.map(s => mapSpeechSessionFromApi(s));
  const growthMetrics: GrowthMetrics =
    p.growthMetrics ??
    computeGrowthMetrics(speechSessions, parseBestStreak(streak));

  return {
    totalXP: u.xpTotal ?? 0,
    weeklyXP: s.xpEarned ?? 0,
    bestStreak: parseBestStreak(streak),
    totalSpeeches: u._count?.speechSessions ?? speechItems.length ?? s.speechSessions ?? 0,
    totalChallenges: u._count?.userChallenges ?? u.totalChallenges ?? 0,
    averageScore: Math.round(s.averageConfidenceScore ?? u.confidenceScore ?? 0),
    confidenceHistory: (p.confidenceTimeline ?? []).map((d: any): DailyScore => ({
      date: typeof d.date === 'string' ? d.date.split('T')[0] : d.date,
      score: Math.round(d.overallConfidenceScore ?? d.score ?? 0),
    })),
    speechSessions,
    growthMetrics,
  };
};

export const useProgress = () =>
  useQuery({
    queryKey: ['progress'],
    queryFn: fetchProgress,
    staleTime: 5 * 60 * 1000,
  });

export const useConfidenceHistory = (period: 'week' | 'month' = 'week') =>
  useQuery({
    queryKey: ['progress', 'history', period],
    queryFn: async (): Promise<DailyScore[]> => {
      const res = await apiClient.get<any, any>('/analytics/me/progress');
      const p = unwrapApiData<any>(res);
      const history: any[] = p.confidenceTimeline ?? [];
      const limit = period === 'week' ? 7 : 30;
      return history.slice(-limit).map((d: any): DailyScore => ({
        date: typeof d.date === 'string' ? d.date.split('T')[0] : d.date,
        score: Math.round(d.overallConfidenceScore ?? d.score ?? 0),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

export const useSpeechSessions = () =>
  useQuery({
    queryKey: ['progress', 'speeches'],
    queryFn: fetchSpeechSessions,
    staleTime: 5 * 60 * 1000,
  });
