import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { useAuth } from '../context/AuthContext';

export type UserSettings = {
  userId: string;
  dailyReminders: boolean;
  soundEffects: boolean;
  darkMode: boolean;
  weeklyReportEmail: boolean;
};

const fetchSettings = async (): Promise<UserSettings> => {
  const res = await apiClient.get<any, any>('/users/me/settings');
  return unwrapApiData<UserSettings>(res);
};

export const useUserSettings = () => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });
};

export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      const res = await apiClient.patch<any, any>('/users/me/settings', patch);
      return unwrapApiData<UserSettings>(res);
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: ['user-settings'] });
      const previous = queryClient.getQueryData<UserSettings>(['user-settings']);
      if (previous) {
        queryClient.setQueryData<UserSettings>(['user-settings'], { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_err, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['user-settings'], context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['user-settings'], data);
    },
  });
};
