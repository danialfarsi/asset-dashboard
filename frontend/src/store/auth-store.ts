import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";
import { login, logout, getMe } from "@/lib/auth";
import type { LoginCredentials } from "@/types/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const data = await login(credentials);
          set({ user: data.user, isLoading: false, isAuthenticated: true });
        } catch (err: any) {
          set({
            error: err.response?.data?.detail || "Login failed",
            isLoading: false,
            isAuthenticated: false,
          });
          throw err;
        }
      },

      logout: async () => {
        await logout();
        set({ user: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        // اگر قبلاً لاگین کرده و توکن دارد، اطلاعات را دریافت کن
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        if (!token) {
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const user = await getMe();
          set({ user, isLoading: false, isAuthenticated: true });
        } catch (error) {
          console.error('Error fetching user:', error);
          // اگر 401 بود، توکن منقضی شده
          set({ user: null, isLoading: false, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),
      
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
