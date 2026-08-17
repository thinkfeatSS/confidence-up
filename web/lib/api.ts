import axios from 'axios';
import Cookies from 'js-cookie';
import { AUTH_COOKIE } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/env';

const API_BASE = getApiBaseUrl();

export const api = axios.create({ baseURL: API_BASE });

function getAuthToken(): string | undefined {
  return Cookies.get(AUTH_COOKIE) ?? Cookies.get('admin_token');
}

function clearAuthToken(): void {
  Cookies.remove(AUTH_COOKIE, { path: '/' });
  Cookies.remove('admin_token', { path: '/' });
}

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => {
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
  },
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthToken();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
