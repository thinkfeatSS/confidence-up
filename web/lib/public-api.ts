import axios from 'axios';
import { getApiBaseUrl } from '@/lib/env';

const API_BASE = getApiBaseUrl();

export const publicApi = axios.create({ baseURL: API_BASE });

publicApi.interceptors.response.use((res) => {
  const payload = res.data;
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    'data' in payload
  ) {
    res.data = payload.data;
  }
  return res;
});
