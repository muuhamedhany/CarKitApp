import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, ThemeColors } from '@/constants/theme';

// ═══════════════════════════════════
// Types
// ═══════════════════════════════════

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: ThemeColors;
};

const THEME_STORAGE_KEY = '@carkit_theme_mode';

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
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setThemeModeState(saved);
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

  // Resolve actual dark/light
  const isDark =
    themeMode === 'dark' ? true
    : themeMode === 'light' ? false
    : systemScheme === 'dark'; // system default — if null, treat as dark

  const colors = isDark ? DarkColors : LightColors;

  // Don't render until theme preference is loaded to avoid flash
  if (!isLoaded) return null;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}
