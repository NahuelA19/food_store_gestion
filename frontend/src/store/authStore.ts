import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string, mustChangePassword?: boolean) => void;
  clearAuth: () => void;
  setUser: (user: User) => void;
  setMustChangePassword: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      mustChangePassword: false,
      setAuth: (user, accessToken, refreshToken, mustChangePassword = false) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true, mustChangePassword }),
      clearAuth: () =>
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, mustChangePassword: false }),
      setUser: (user) => set({ user }),
      setMustChangePassword: (value) => set({ mustChangePassword: value }),
    }),
    { name: 'auth-storage' }
  )
);
