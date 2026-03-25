import { StateCreator } from 'zustand';
import { User } from '@/types';

export interface AuthSlice {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  user: null,
  token: null,
  isLoading: true,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
  setLoading: (isLoading) => set({ isLoading }),
});
