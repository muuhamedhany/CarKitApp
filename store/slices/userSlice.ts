import { StateCreator } from 'zustand';
import { User } from '@/types';

export interface UserSlice {
  profile: User | null;
  setProfile: (profile: User | null) => void;
}

export const createUserSlice: StateCreator<UserSlice> = (set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
});
