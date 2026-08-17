import { create } from 'zustand';
import Cookies from 'js-cookie';
import { AUTH_COOKIE, AUTH_COOKIE_OPTIONS } from '@/lib/auth';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthStore {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    Cookies.remove(AUTH_COOKIE, { path: '/' });
    Cookies.remove('admin_token', { path: '/' });
    set({ user: null });
    window.location.href = '/login';
  },
}));
