import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, ThemeColors, ThemeVariant, getColors } from '@/constants/theme';

// ═══════════════════════════════════
// Types
// ═══════════════════════════════════

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  themeVariant: ThemeVariant;
  setThemeVariant: (variant: ThemeVariant) => void;
  isDark: boolean;
  colors: ThemeColors;
  isThemeLoaded: boolean;
};

const THEME_STORAGE_KEY = '@carkit_theme_mode';
const VARIANT_STORAGE_KEY = '@carkit_theme_variant';

// ═══════════════════════════════════
// Context
// ═══════════════════════════════════

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used within a ThemeProvider');
  return context;
}

// ═══════════════════════════════════
// Provider
// ═══════════════════════════════════

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [themeVariant, setThemeVariantState] = useState<ThemeVariant>('traditional');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const [savedMode, savedVariant] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(VARIANT_STORAGE_KEY),
        ]);

        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
          setThemeModeState(savedMode);
        }
        if (savedVariant === 'traditional' || savedVariant === 'green') {
          setThemeVariantState(savedVariant);
        }
      } catch {
        // default to system
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  // Persist when changed
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // silently fail
    }
  };

  const setThemeVariant = async (variant: ThemeVariant) => {
    setThemeVariantState(variant);
    try {
      await AsyncStorage.setItem(VARIANT_STORAGE_KEY, variant);
    } catch {
      // silently fail
    }
  };

  // Resolve actual dark/light
  const isDark =
    themeMode === 'dark' ? true
    : themeMode === 'light' ? false
    : systemScheme === 'dark'; // system default — if null, treat as dark

  const colors = getColors(isDark, themeVariant);

  // Don't render until theme preference is loaded to avoid flash
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, themeVariant, setThemeVariant, isDark, colors, isThemeLoaded: isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}
