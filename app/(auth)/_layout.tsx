import { useTheme } from '@/hooks/useTheme';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { isDark } = useTheme();

  return (
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: isDark ? '#050505' : '#F8F9FD' },
      animation: 'fade_from_bottom',
      animationDuration: 200,
    }}>
      <Stack.Screen name="login" options={{ title: '' }} />
      <Stack.Screen name="select-account" options={{ title: '' }} />
      <Stack.Screen name="signup-customer" options={{ title: '' }} />
      <Stack.Screen name="signup-vendor" options={{ title: '' }} />
      <Stack.Screen name="forgot-password" options={{ title: '' }} />
      <Stack.Screen name="otp-verification" options={{ title: '' }} />
      <Stack.Screen name="reset-password" options={{ title: '' }} />
    </Stack>
  );
}
