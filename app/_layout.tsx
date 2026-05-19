import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { ThemeProvider, useThemeContext } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { isDark, isThemeLoaded, colors } = useThemeContext();

  useEffect(() => {
    if (isThemeLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isThemeLoaded]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade_from_bottom',
          animationDuration: 200,
        }}
      >
        <Stack.Screen name="index" options={{ title: '' }} />
        <Stack.Screen name="onboarding" options={{ title: '' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="(vendor-tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="(provider-tabs)" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="settings/password" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="settings/privacy" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="settings/terms" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="my-orders" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="my-bookings" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="booking-confirmation" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="booking-success" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="booking/[id]" options={{ headerShown: false, title: '' }} />
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
        <Stack.Screen name="service/[id]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="add-service" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="provider-service/[id]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="provider-booking/[id]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="edit-service/[id]" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="ad-payment" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="ad-success" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="add-product" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="category-filter" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="create-ad" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="pending" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="promote" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="upload-documents" options={{ headerShown: false, title: '' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
    // Fonts are loaded, but we wait for Theme to hide splash in InnerLayout
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <ToastProvider>
                <WishlistProvider>
                  <InnerLayout />
                </WishlistProvider>
              </ToastProvider>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
