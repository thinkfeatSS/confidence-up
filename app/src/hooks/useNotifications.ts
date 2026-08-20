import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { useAuth } from '../context/AuthContext';

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'BADGE_EARNED' | 'LEVEL_UP' | 'STREAK_REMINDER' | 'MISSION_REMINDER' | 'ANNOUNCEMENT' | 'SUPPORT_REPLY' | 'SYSTEM';
  referenceId?: string;
  isRead: boolean;
  sentAt: string;
}

export interface NotificationsResponse {
  items: InAppNotification[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const useNotifications = (page = 1, limit = 20) => {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: async (): Promise<NotificationsResponse> => {
      const res = await apiClient.get<any, any>('/notifications', { params: { page, limit } });
      const payload = unwrapApiData<NotificationsResponse>(res);
      return {
        items: payload.items ?? (Array.isArray(payload) ? payload : []),
        total: payload.total ?? 0,
        page: payload.page ?? page,
        limit: payload.limit ?? limit,
        pages: payload.pages ?? 1,
      };
    },
    staleTime: 60 * 1000,
    enabled: isAuthenticated,
  });
};

export const useUnreadNotificationCount = () => {
  const { data } = useNotifications(1, 20);
  const unreadCount = (data?.items ?? []).filter((item) => !item.isRead).length;
  return unreadCount;
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<any, any>(`/notifications/${id}/read`);
      return unwrapApiData<any>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<any, any>('/notifications/read-all');
      return unwrapApiData<any>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
