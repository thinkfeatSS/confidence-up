import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';
import { parseApiError } from '../utils/apiError';

export { API_BASE_URL };

const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const USER_KEY = '@auth_user';

/** Auth routes must not trigger token refresh (e.g. wrong password → 401) */
const AUTH_SKIP_REFRESH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/google/mobile',
  '/auth/refresh',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
];

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let onSessionInvalidated: (() => void) | null = null;
let onNetworkFailure: (() => void) | null = null;

export function setOnSessionInvalidated(callback: (() => void) | null) {
  onSessionInvalidated = callback;
}

export function setOnNetworkFailure(callback: (() => void) | null) {
  onNetworkFailure = callback;
}

function isAuthRoute(url?: string): boolean {
  if (!url) return false;
  return AUTH_SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

async function clearStoredSession() {
  await Promise.all([
    AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    AsyncStorage.removeItem(USER_KEY),
  ]);
}

/** Unwrap NestJS `{ success, data }` envelope returned by apiClient */
export function unwrapApiData<T>(res: unknown): T {
  if (res && typeof res === 'object' && 'data' in res && 'success' in res) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res.data,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const requestUrl = originalRequest?.url ?? '';

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRoute(requestUrl)
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const payload = response.data?.data ?? response.data;
        const { accessToken, refreshToken: newRefresh } = payload;

        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefresh);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch {
        await clearStoredSession();
        onSessionInvalidated?.();
        throw parseApiError(error, 'Your session has expired. Please sign in again.');
      }
    }

    throw (() => {
      const parsed = parseApiError(error);
      if (parsed.isNetworkError) onNetworkFailure?.();
      return parsed;
    })();
  },
);
