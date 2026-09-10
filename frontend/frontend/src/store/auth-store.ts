'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/api';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getMe: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login/', { email, password });
          const { access, refresh, user } = response.data;
          
          if (access) {
            Cookies.set('access_token', access, { secure: true, sameSite: 'strict' });
            Cookies.set('refresh_token', refresh || '', { secure: true, sameSite: 'strict' });
            set({ user, isAuthenticated: true, isLoading: false });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          const refresh = Cookies.get('refresh_token');
          if (refresh) {
            await api.post('/auth/logout/', { refresh }).catch(() => {});
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          set({ user: null, isAuthenticated: false });
          window.location.href = '/login';
        }
      },

      getMe: async () => {
        set({ isLoading: true });
        try {
          const token = Cookies.get('access_token');
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }
          
          const { data } = await api.get<User>('/auth/me/');
          set({ user: data, isAuthenticated: true, isLoading: false });
        } catch (error) {
          console.error('Get me error:', error);
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
