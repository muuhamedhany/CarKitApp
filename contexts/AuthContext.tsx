import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/constants/config';

type User = {
  user_id?: number;
  name: string;
  email: string;
  phone?: string;
  picture?: string;
  provider?: 'local' | 'google';
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (googleUser: { email: string; name: string; picture?: string; id: string }) => Promise<{ success: boolean; message: string }>;
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

  // Load stored auth on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        // Ignore errors
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('token', data.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        setToken(data.data.token);
        setUser(data.data.user);
        return { success: true, message: 'Login successful.' };
      }
      return { success: false, message: data.message || 'Invalid credentials.' };
    } catch {
      return { success: false, message: 'Could not connect to the server.' };
    }
  };

  const register = async (regData: { name: string; email: string; phone: string; password: string }) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });
      const data = await response.json();

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
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          picture: googleUser.picture,
        }),
      });
      const data = await response.json();

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
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      return { success: data.success, message: data.message };
    } catch {
      return { success: false, message: 'Could not connect to server.' };
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
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
