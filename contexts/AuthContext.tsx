import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/services/api/auth.service';
import { User } from '@/types';

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: User }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  loginWithGoogle: (googleUser: { email: string; name: string; picture?: string; id: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth on mount — then refresh from server to get latest role/token
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');

        if (!storedToken || !storedUser) {
          setIsLoading(false);
          return;
        }

        // Set state immediately from storage so the app isn't blocked
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // Then refresh session in the background to get fresh role/token from the server
        try {
          const API_URL = process.env.EXPO_PUBLIC_API_URL;
          const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              // Replace stale token+user with fresh data from server
              await AsyncStorage.setItem('token', data.data.token);
              await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
              setToken(data.data.token);
              setUser(data.data.user);
            }
          }
        } catch {
          // Server unreachable — keep using stored data, will fail at API call time
        }
      } catch (e) {
        // Storage error — clear and force re-login
        await AsyncStorage.multiRemove(['token', 'user']);
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);

      if (data.success) {
        await AsyncStorage.setItem('token', data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true, message: 'Login successful.', user: data.data.user };
      }
      return { success: false, message: data.message || 'Invalid credentials.' };
    } catch {
      return { success: false, message: 'Could not connect to the server.' };
    }
  };

  const register = async (regData: { name: string; email: string; phone: string; password: string }) => {
    try {
      const data = await authService.register(regData);

      if (data.success) {
        await AsyncStorage.setItem('token', data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true, message: 'Registered successfully.' };
      }
      return { success: false, message: data.message || 'Could not create account.' };
    } catch {
      return { success: false, message: 'Could not connect to the server.' };
    }
  };

  const loginWithGoogle = async (googleUser: { email: string; name: string; picture?: string; id: string }) => {
    try {
      // Try server-side Google auth first
      const data = await authService.loginWithGoogle({
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.id,
        picture: googleUser.picture,
      });

      if (data.success) {
        await AsyncStorage.setItem('token', data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true, message: 'Logged in with Google.' };
      }
      return { success: false, message: data.message || 'Google login failed on server.' };
    } catch {
      // If server endpoint doesn't exist yet, login client-side only
      const localUser: User = {
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        provider: 'google',
      };
      await AsyncStorage.setItem('token', `google_${googleUser.id}`);
      await AsyncStorage.setItem('user', JSON.stringify(localUser));
      setToken(`google_${googleUser.id}`);
      setUser(localUser);
      return { success: true, message: 'Logged in with Google.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    try {
      const data = await authService.forgotPassword(email);
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const data = await authService.verifyOtp(email, otp);
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      const data = await authService.resetPassword(email, otp, newPassword);
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      login, register, loginWithGoogle, logout,
      forgotPassword, verifyOtp, resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}
