import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, unwrapApiData, setOnSessionInvalidated } from '../services/api';
import { NotificationsService } from '../services/notifications';
import { acceptLegalDocuments } from '../services/complianceService';
import { mapUserFromApi } from '../utils/mapUserProfile';

const ACCESS_TOKEN_KEY = '@auth_access_token';
const REFRESH_TOKEN_KEY = '@auth_refresh_token';
const USER_KEY = '@auth_user';
const ONBOARDING_KEY = '@confidence_up_onboarding';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  xpTotal: number;
  level: number;
  isVerified: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  completeOnboarding: (data: {
    fears?: string[];
    goals?: string[];
    dailyTime?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasCompletedOnboarding: false,
  register: async () => {},
  login: async () => {},
  loginWithGoogle: async () => {},
  verifyEmail: async () => {},
  resendOtp: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  completeOnboarding: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const clearLocalSession = async () => {
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
        AsyncStorage.removeItem(ONBOARDING_KEY),
      ]);
      setUser(null);
      setHasCompletedOnboarding(false);
    };

    setOnSessionInvalidated(() => {
      clearLocalSession().catch(() => {});
    });

    const restoreSession = async () => {
      try {
        const [storedUser, accessToken, onboarding] = await Promise.all([
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
        ]);

        if (!storedUser || !accessToken) {
          if (storedUser) {
            await Promise.all([
              AsyncStorage.removeItem(USER_KEY),
              AsyncStorage.removeItem(ONBOARDING_KEY),
            ]);
          }
          return;
        }

        const res = await apiClient.get<any, any>('/users/me');
        const apiUser = unwrapApiData<Record<string, any>>(res);
        const mapped = mapUserFromApi(apiUser);

        setUser({
          id: mapped.id,
          name: mapped.name,
          email: mapped.email,
          role: String(apiUser.role ?? 'USER'),
          avatarUrl: mapped.avatar,
          xpTotal: mapped.xp,
          level: mapped.level,
          isVerified: Boolean(apiUser.isVerified ?? true),
        });
        setHasCompletedOnboarding(onboarding === 'true');
      } catch {
        await Promise.all([
          AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
          AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
          AsyncStorage.removeItem(USER_KEY),
          AsyncStorage.removeItem(ONBOARDING_KEY),
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    return () => setOnSessionInvalidated(null);
  }, []);

  const persistUser = useCallback(async (u: AuthUser) => {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await apiClient.post('/auth/register', { name, email, password });
      // Don't store user yet — wait for OTP verification
    },
    [],
  );

  const persistSession = useCallback(async (apiUser: any, accessToken: string, refreshToken: string) => {
    await Promise.all([
      AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken),
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
    ]);
    await persistUser({
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      role: apiUser.role,
      avatarUrl: apiUser.avatarUrl,
      xpTotal: apiUser.xpTotal ?? 0,
      level: apiUser.level ?? 1,
      isVerified: apiUser.isVerified ?? true,
    });
    if (apiUser.onboardingCompleted) {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
    } else {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setHasCompletedOnboarding(false);
    }
    acceptLegalDocuments().catch(() => {});
  }, [persistUser]);

  const login = useCallback(async (email: string, password: string) => {
    const device = await NotificationsService.getAuthDevicePayload();
    const res = await apiClient.post<any, any>('/auth/login', { email, password, ...device });
    const payload = unwrapApiData<{ accessToken: string; refreshToken: string; user: any }>(res);
    await persistSession(payload.user, payload.accessToken, payload.refreshToken);
  }, [persistSession]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const device = await NotificationsService.getAuthDevicePayload();
    const res = await apiClient.post<any, any>('/auth/google/mobile', {
      idToken,
      ...device,
      platform: device.platform ?? 'ANDROID',
    });
    const payload = unwrapApiData<{ accessToken: string; refreshToken: string; user: any }>(res);
    await persistSession(payload.user, payload.accessToken, payload.refreshToken);
  }, [persistSession]);

  const verifyEmail = useCallback(async (email: string, otp: string) => {
    await apiClient.post('/auth/verify-email', { email, otp });
  }, []);

  const resendOtp = useCallback(async (email: string) => {
    await apiClient.post('/auth/verify-email/resend', { email });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  }, []);

  const resetPassword = useCallback(
    async (email: string, otp: string, newPassword: string) => {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
    },
    [],
  );

  const completeOnboarding = useCallback(
    async (data: { fears?: string[]; goals?: string[]; dailyTime?: string }) => {
      try {
        await apiClient.post('/users/me/onboarding', data);
      } catch {
        // Allow local completion if API is unreachable
      }
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasCompletedOnboarding(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // fire-and-forget
    }
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(ONBOARDING_KEY),
    ]);
    setUser(null);
    setHasCompletedOnboarding(false);
  }, []);

  const updateUser = useCallback(
    (data: Partial<AuthUser>) => {
      if (!user) return;
      const updated = { ...user, ...data };
      setUser(updated);
      AsyncStorage.setItem(USER_KEY, JSON.stringify(updated)).catch(() => {});
    },
    [user],
  );

  const isAuthenticated = user !== null && user.isVerified;

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      hasCompletedOnboarding,
      register,
      login,
      loginWithGoogle,
      verifyEmail,
      resendOtp,
      forgotPassword,
      resetPassword,
      completeOnboarding,
      logout,
      updateUser,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      hasCompletedOnboarding,
      register,
      login,
      loginWithGoogle,
      verifyEmail,
      resendOtp,
      forgotPassword,
      resetPassword,
      completeOnboarding,
      logout,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
