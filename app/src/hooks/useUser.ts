import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapApiData } from '../services/api';
import { User } from '../types';
import { mapUserFromApi } from '../utils/mapUserProfile';

const fetchUser = async (): Promise<User> => {
  const res = await apiClient.get<any, any>('/users/me');
  return mapUserFromApi(unwrapApiData<Record<string, any>>(res));
};

export const useUser = () =>
  useQuery({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
  });
