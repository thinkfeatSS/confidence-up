import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { mapUserFromApi, type WebUser } from '@/lib/mapUser';

export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<WebUser> => {
      const res = await api.get('/users/me');
      return mapUserFromApi(res.data as Record<string, unknown>);
    },
    staleTime: 5 * 60 * 1000,
  });
}
