import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
