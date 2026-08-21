import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { UserProgress, DailyScore, SpeechSession } from '../types';
import { parseBestStreak } from '../utils/mapUserProfile';
import { unwrapList, mapSpeechSessionFromApi } from '../utils/apiHelpers';
import { computeGrowthMetrics } from '../modules/speech/intelligence/growthAnalytics';
import { GrowthMetrics } from '../modules/speech/types/speechAnalysis.types';
import { getLocalSpeechSessions, mergeSpeechSessions } from '../services/localSpeechStorage';

const fetchSpeechSessions = async (): Promise<SpeechSession[]> => {
  let apiSessions: SpeechSession[] = [];
  try {
    const res = await apiClient.get<any, any>('/speech/sessions', { params: { page: 1, limit: 50 } });
    apiSessions = unwrapList<any>(res).map(s => mapSpeechSessionFromApi(s));
  } catch (err) {
    console.warn('[useSpeechSessions] Remote fetch failed, falling back to local storage:', err);
  }

  const localSessions = await getLocalSpeechSessions();
  const merged = mergeSpeechSessions(apiSessions, localSessions);
  return merged;
};

const fetchProgress = async (): Promise<UserProgress> => {
  const [summaryRes, progressRes, userRes, streakRes, speechRes] = await Promise.allSettled([
    apiClient.get<any, any>('/analytics/me/summary'),
    apiClient.get<any, any>('/analytics/me/progress'),
    apiClient.get<any, any>('/users/me'),
    apiClient.get<any, any>('/gamification/me/streak'),
    apiClient.get<any, any>('/speech/sessions', { params: { page: 1, limit: 50 } }),
  ]);

  const s = summaryRes.status === 'fulfilled' ? unwrapApiData<any>(summaryRes.value) : {};
  const p = progressRes.status === 'fulfilled' ? unwrapApiData<any>(progressRes.value) : {};
  const u = userRes.status === 'fulfilled' ? unwrapApiData<any>(userRes.value) : {};
  const streak = streakRes.status === 'fulfilled' ? unwrapApiData<any>(streakRes.value) : {};
  const speechItems = speechRes.status === 'fulfilled' ? unwrapList<any>(speechRes.value) : [];
  
  const apiSpeechSessions = speechItems.map(item => mapSpeechSessionFromApi(item));
  const localSessions = await getLocalSpeechSessions();
  const speechSessions = mergeSpeechSessions(apiSpeechSessions, localSessions);

  const growthMetrics: GrowthMetrics =
    p.growthMetrics ??
    computeGrowthMetrics(speechSessions, parseBestStreak(streak));

  const totalSpeeches = Math.max(
    u._count?.speechSessions ?? 0,
    speechSessions.length,
    s.speechSessions ?? 0,
  );

  return {
    totalXP: u.xpTotal ?? 0,
    weeklyXP: s.xpEarned ?? 0,
    bestStreak: parseBestStreak(streak),
    totalSpeeches,
    totalChallenges: u._count?.userChallenges ?? u.totalChallenges ?? 0,
    averageScore: Math.round(s.averageConfidenceScore ?? u.confidenceScore ?? (speechSessions.length ? speechSessions.reduce((acc, cur) => acc + cur.overallScore, 0) / speechSessions.length : 0)),
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
    staleTime: 60 * 1000,
  });

export const useConfidenceHistory = (period: 'week' | 'month' = 'week') =>
  useQuery({
    queryKey: ['progress', 'history', period],
    queryFn: async (): Promise<DailyScore[]> => {
      try {
        const res = await apiClient.get<any, any>('/analytics/me/progress');
        const p = unwrapApiData<any>(res);
        const history: any[] = p.confidenceTimeline ?? [];
        const limit = period === 'week' ? 7 : 30;
        return history.slice(-limit).map((d: any): DailyScore => ({
          date: typeof d.date === 'string' ? d.date.split('T')[0] : d.date,
          score: Math.round(d.overallConfidenceScore ?? d.score ?? 0),
        }));
      } catch {
        return [];
      }
    },
    staleTime: 60 * 1000,
  });

export const useSpeechSessions = () =>
  useQuery({
    queryKey: ['progress', 'speeches'],
    queryFn: fetchSpeechSessions,
    staleTime: 60 * 1000,
  });

