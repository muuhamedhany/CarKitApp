import { Colors, Fonts, Spacing, BorderRadius } from '@/constants/theme';
import { Layout } from '@/constants/Layout';

// In a real app with light/dark mode, this hook would dynamically return
// the right colors based on the current color scheme.
export function useTheme() {
  return {
    colors: Colors,
    fonts: Fonts,
    spacing: Spacing,
    borderRadius: BorderRadius,
    layout: Layout,
    isDark: true, // Assuming dark theme is default for CarKit
  };
}
