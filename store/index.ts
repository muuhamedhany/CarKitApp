import { create } from 'zustand';
import { createAuthSlice, AuthSlice } from './slices/authSlice';
import { createUserSlice, UserSlice } from './slices/userSlice';

type StoreState = AuthSlice & UserSlice;

export const useStore = create<StoreState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUserSlice(...a),
}));
