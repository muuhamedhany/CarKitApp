import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold_Italic,
} from '@expo-google-fonts/poppins';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ThemeProvider, useThemeContext } from '@/contexts/ThemeContext';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { isDark } = useThemeContext();

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: '' }} />
        <Stack.Screen name="onboarding" options={{ title: '' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="(vendor-tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="(provider-tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="my-orders" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="my-bookings" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="checkout" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="order-success" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="order-failure" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="add-vehicle-prompt" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="add-vehicle-signup" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="my-vehicles" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="add-vehicle" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="vehicle-detail" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="edit-product/[id]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="wishlist" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="image-viewer" options={{ headerShown: false, title: '', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="vendor-analytics" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="provider-analytics" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="add-service" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="provider-service/[id]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="provider-booking/[id]" options={{ headerShown: false, title: '' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold_Italic,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <WishlistProvider>
              <InnerLayout />
            </WishlistProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
