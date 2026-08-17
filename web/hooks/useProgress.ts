import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

import {

  mapProgressFromApi,

  type DailyScore,

  type UserProgress,

} from '@/lib/mapUser';

import { mapSpeechSessionFromApi, type WebSpeechSession } from '@/lib/mapSpeech';



function unwrapSpeechItems(payload: unknown): Record<string, unknown>[] {

  if (Array.isArray(payload)) return payload as Record<string, unknown>[];

  if (payload && typeof payload === 'object') {

    const items = (payload as { items?: unknown[] }).items;

    if (Array.isArray(items)) return items as Record<string, unknown>[];

  }

  return [];

}



async function fetchProgress(): Promise<UserProgress> {

  const [summaryRes, progressRes, userRes, streakRes, speechRes] = await Promise.all([

    api.get('/analytics/me/summary'),

    api.get('/analytics/me/progress'),

    api.get('/users/me'),

    api.get('/gamification/me/streak'),

    api.get('/speech/sessions', { params: { page: 1, limit: 50 } }),

  ]);



  const speechItems = unwrapSpeechItems(speechRes.data);



  return mapProgressFromApi(

    summaryRes.data as Record<string, unknown>,

    progressRes.data as Record<string, unknown>,

    userRes.data as Record<string, unknown>,

    streakRes.data as Record<string, unknown>,

    speechItems,

  );

}



export function useProgress() {

  return useQuery({

    queryKey: ['progress'],

    queryFn: fetchProgress,

    staleTime: 5 * 60 * 1000,

  });

}



export function useConfidenceHistory(period: 'week' | 'month' = 'week') {

  return useQuery({

    queryKey: ['progress', 'history', period],

    queryFn: async (): Promise<DailyScore[]> => {

      const res = await api.get('/analytics/me/progress');

      const timeline =

        ((res.data as Record<string, unknown>).confidenceTimeline as Record<

          string,

          unknown

        >[]) ?? [];

      const limit = period === 'week' ? 7 : 30;

      return timeline.slice(-limit).map((d) => ({

        date:

          typeof d.date === 'string' ? d.date.split('T')[0] : String(d.date ?? ''),

        score: Math.round(

          (d.overallConfidenceScore as number) ?? (d.score as number) ?? 0,

        ),

      }));

    },

    staleTime: 5 * 60 * 1000,

  });

}



export function useSpeechSessions() {

  return useQuery({

    queryKey: ['progress', 'speeches'],

    queryFn: async (): Promise<WebSpeechSession[]> => {

      const res = await api.get('/speech/sessions', { params: { page: 1, limit: 50 } });

      return unwrapSpeechItems(res.data).map((item) => mapSpeechSessionFromApi(item));

    },

    staleTime: 5 * 60 * 1000,

  });

}


