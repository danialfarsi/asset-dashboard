import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/auth";
import { login, logout, getMe } from "@/lib/auth";
import type { LoginCredentials } from "@/types/auth";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const data = await login(credentials);
          set({ user: data.user, isLoading: false });
        } catch (err: any) {
          set({
            error: err.response?.data?.detail || "Login failed",
            isLoading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        await logout();
        set({ user: null });
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const user = await getMe();
          set({ user, isLoading: false });
        } catch {
          set({ user: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
