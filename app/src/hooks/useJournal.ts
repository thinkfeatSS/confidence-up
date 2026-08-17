import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { JournalEntry, MoodLevel } from '../types';
import { unwrapList } from '../utils/apiHelpers';

const mapEntry = (e: any): JournalEntry => ({
  id: e.id,
  title: e.title,
  body: e.body ?? e.content ?? '',
  mood: (e.mood ?? 3) as MoodLevel,
  date: e.date ?? e.createdAt?.split('T')[0] ?? new Date().toISOString().split('T')[0],
  linkedChallengeId: e.linkedChallengeId,
});

const fetchJournal = async (): Promise<JournalEntry[]> => {
  const res = await apiClient.get<any, any>('/journal', { params: { page: 1, limit: 100 } });
  return unwrapList<any>(res).map(mapEntry).sort((a, b) => b.date.localeCompare(a.date));
};

export const useJournal = () =>
  useQuery({ queryKey: ['journal'], queryFn: fetchJournal, staleTime: 2 * 60 * 1000 });

export const useAddJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: {
      title: string;
      body: string;
      mood: MoodLevel;
    }): Promise<JournalEntry> => {
      const res = await apiClient.post<any, any>('/journal', {
        title: entry.title,
        body: entry.body,
        mood: entry.mood,
      });
      return mapEntry(unwrapApiData<any>(res));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    },
  });
};

export const useUpdateJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      body,
      mood,
    }: {
      id: string;
      title?: string;
      body?: string;
      mood?: MoodLevel;
    }): Promise<JournalEntry> => {
      const res = await apiClient.patch<any, any>(`/journal/${id}`, { title, body, mood });
      return mapEntry(unwrapApiData<any>(res));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
};

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      await apiClient.delete(`/journal/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
    },
  });
};
