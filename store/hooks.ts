import { useStore } from './index';

// Dedicated hooks for specific slices
export const useAuthStore = () => useStore((state) => ({
  user: state.user,
  token: state.token,
  isLoading: state.isLoading,
  setAuth: state.setAuth,
  logout: state.logout,
  setLoading: state.setLoading,
}));

export const useUserStore = () => useStore((state) => ({
  profile: state.profile,
  setProfile: state.setProfile,
}));
