import { Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { Layout } from '@/constants/Layout';
import { useThemeContext, ThemeMode } from '@/contexts/ThemeContext';
import { ThemeColors } from '@/constants/theme';

export function useTheme() {
  const { colors, isDark, themeMode, setThemeMode } = useThemeContext();

  return {
    colors,
    fonts: Fonts,
    spacing: Spacing,
    borderRadius: BorderRadius,
    layout: Layout,
    isDark,
    themeMode,
    setThemeMode,
  };
}
