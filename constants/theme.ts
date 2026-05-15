// CarKit Design System — Dark & Light themes with neon purple/pink accents

export const Fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  boldItalic: 'Poppins_700Bold_Italic',
  extraBoldItalic: 'Poppins_800ExtraBold_Italic',
};

// ═══════════════════════════════════
// Animations & Easing (SATISFYING Phase)
// ═══════════════════════════════════
export const Animations = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  easing: {
    out: 'ease-out',
    in: 'ease-in',
    inOut: 'ease-in-out',
  }
};

// ═══════════════════════════════════
// Elevation & Shadows
// ═══════════════════════════════════
import { Platform } from 'react-native';

const androidElevation = (level: number) =>
  Platform.OS === 'android' ? 0 : level;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: androidElevation(2),
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: androidElevation(4),
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: androidElevation(8),
  },
  pink: {
    shadowColor: '#CD42A8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: androidElevation(10),
  },
  purple: {
    shadowColor: '#5923A0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: androidElevation(10),
  }
};

// ═══════════════════════════════════
// Dark Theme Colors
// ═══════════════════════════════════
export const DarkColors = {
  // Backgrounds
  background: '#050505',
  backgroundSecondary: '#0D0D0F',
  card: 'rgba(20, 20, 25, 0.6)',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  glass: 'rgba(255, 255, 255, 0.03)',
  glassHighlight: 'rgba(255, 255, 255, 0.08)',
  FormBg: '#0d0d0f2f',

  // Primary
  pink: '#CD42A8',
  pinkLight: '#FF69B4',
  purple: '#5923A0',
  purpleDark: '#411977',
  purpleLight: '#B388FF',

  // Gradient
  gradientStart: '#CD42A8',
  gradientEnd: '#5923A0',
  bgGradientStart: '#1A0B2E',
  bgGradientEnd: '#000000',

  // Text
  textPrimary: '#F8F7FF',
  textSecondary: '#AA9DBB',
  textMuted: '#6B6B80',

  border: '#2A2A3A',
  primary: '#CD42A8',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.8)',
  surface: '#12121A',

  // Status
  success: '#00C853',
  error: '#FF3D00',
  warning: '#FFAB00',
  info: '#2979FF',

  // Extras
  imagePlaceholder: 'rgba(255, 255, 255, 0.05)',
  purpleGlow: 'rgba(147, 51, 234, 0.2)',
  pinkGlow: 'rgba(236, 72, 153, 0.2)',
  dividerLine: 'rgba(255, 255, 255, 0.06)',
  inputBorder: 'rgba(255, 255, 255, 0.12)',
  toastBorder: 'rgba(255, 255, 255, 0.1)',
  itemSeparator: 'rgba(255, 255, 255, 0.04)',
};

// ═══════════════════════════════════
// Green Dark Theme Colors
// ═══════════════════════════════════
export const GreenDarkColors = {
  ...DarkColors,
  background: '#040806',
  backgroundSecondary: '#08120D',
  card: 'rgba(15, 25, 20, 0.6)',
  surface: '#0A1A12',
  FormBg: 'rgba(5, 20, 15, 0.3)',
  pink: '#10B981',
  pinkLight: '#34D399',
  purple: '#4A5D23',
  purpleDark: '#2D3A15',
  purpleLight: '#D1FAE5',
  gradientStart: '#10B981',
  gradientEnd: '#4A5D23',
  bgGradientStart: '#0A2418',
  bgGradientEnd: '#050505',
  primary: '#10B981',
  purpleGlow: 'rgba(74, 93, 35, 0.2)',
  pinkGlow: 'rgba(16, 185, 129, 0.2)',
  cardBorder: 'rgba(16, 185, 129, 0.15)',
  inputBorder: 'rgba(16, 185, 129, 0.2)',
  toastBorder: 'rgba(16, 185, 129, 0.1)',
  dividerLine: 'rgba(16, 185, 129, 0.08)',
};

// ═══════════════════════════════════
// Soft Boutique Light Theme Colors
// ═══════════════════════════════════
export const LightColors = {
  // Backgrounds - Switched from stark white to warm off-white
  background: '#FAFAFC',
  backgroundSecondary: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.98)',
  cardBorder: 'rgba(205, 66, 168, 0.12)',
  glass: 'rgba(255, 255, 255, 0.85)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',
  FormBg: '#ffffffef',

  // Primary
  pink: '#CD42A8',
  pinkLight: '#E573C4',
  purple: '#5923A0',
  purpleDark: '#411977',
  purpleLight: '#7E57C2',

  // Gradient - Softer pastels
  gradientStart: '#6D28D9',
  gradientEnd: '#CD42A8',
  bgGradientStart: '#F5F3FF',
  bgGradientEnd: '#FAFAFC',

  // Text - Softened Slate instead of near-black
  textPrimary: '#1E293B',
  textSecondary: '#475569',
  textMuted: '#94A3B8',

  border: '#F1F5F9',
  primary: '#CD42A8',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(15, 23, 42, 0.4)',
  surface: '#FFFFFF',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Extras
  imagePlaceholder: 'rgba(205, 66, 168, 0.03)',
  purpleGlow: 'rgba(89, 35, 160, 0.03)',
  pinkGlow: 'rgba(205, 66, 168, 0.03)',
  dividerLine: 'rgba(0, 0, 0, 0.04)',
  inputBorder: 'rgba(205, 66, 168, 0.15)',
  toastBorder: 'rgba(0, 0, 0, 0.03)',
  itemSeparator: 'rgba(0,0,0,0.03)',
};

// ═══════════════════════════════════
// Green Light Theme Colors
// ═══════════════════════════════════
export const GreenLightColors = {
  ...LightColors,
  background: '#F7FEE7',
  backgroundSecondary: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.95)',
  surface: '#FFFFFF',
  FormBg: 'rgba(255, 255, 255, 0.9)',
  pink: '#10B981',
  pinkLight: '#34D399',
  purple: '#059669',
  purpleDark: '#065F46',
  purpleLight: '#D1FAE5',
  gradientStart: '#10B981',
  gradientEnd: '#059669',
  bgGradientStart: '#F0FDF4',
  bgGradientEnd: '#F7FEE7',
  primary: '#10B981',
};

export type ThemeColors = typeof DarkColors;
export type ThemeVariant = 'traditional' | 'green';

export function getColors(isDark: boolean, variant: ThemeVariant = 'traditional'): ThemeColors {
  if (variant === 'green') {
    return isDark ? GreenDarkColors : GreenLightColors;
  }
  return isDark ? DarkColors : LightColors;
}

export const Colors = DarkColors;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 28,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 24,
  full: 999,
};

export const IconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 40,
};

export const ZIndex = {
  base: 0,
  card: 10,
  header: 50,
  modal: 100,
  toast: 200,
};
