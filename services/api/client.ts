import { API_URL } from '@/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Helper to make authenticated requests to the CarKit API.
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}
