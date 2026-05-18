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
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: androidElevation(12),
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
  surfaceElevated: '#171722',
  surfacePressed: 'rgba(255, 255, 255, 0.08)',
  surfaceMuted: 'rgba(255, 255, 255, 0.05)',
  accentSoft: 'rgba(205, 66, 168, 0.16)',
  accentBorder: 'rgba(205, 66, 168, 0.28)',
  shadowColor: '#000000',

  // Status
  success: '#00C853',
  error: '#FF3D00',
  warning: '#FFAB00',
  info: '#2979FF',
  successSoft: 'rgba(0, 200, 83, 0.14)',
  errorSoft: 'rgba(255, 61, 0, 0.14)',
  warningSoft: 'rgba(255, 171, 0, 0.14)',
  infoSoft: 'rgba(41, 121, 255, 0.14)',

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
  background: '#050B08',
  backgroundSecondary: '#0C1410',
  card: 'rgba(12, 20, 16, 0.6)',
  surface: '#07100D',
  FormBg: 'rgba(12, 20, 16, 0.35)',
  pink: '#10B981',
  pinkLight: '#34D399',
  purple: '#4A5D23',
  purpleDark: '#2D3A15',
  purpleLight: '#D1FAE5',
  gradientStart: '#10B981',
  gradientEnd: '#4A5D23',
  bgGradientStart: '#0B2A1B',
  bgGradientEnd: '#030705',
  primary: '#10B981',
  surfaceElevated: '#0C1814',
  surfacePressed: 'rgba(16, 185, 129, 0.10)',
  surfaceMuted: 'rgba(16, 185, 129, 0.06)',
  accentSoft: 'rgba(16, 185, 129, 0.16)',
  accentBorder: 'rgba(16, 185, 129, 0.28)',
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
  // Backgrounds - calm solid surfaces for readable light mode
  background: '#F6F7FB',
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#DDE3EE',
  glass: '#FFFFFF',
  glassHighlight: '#F8FAFC',
  FormBg: '#F8FAFC',

  // Primary
  pink: '#B83291',
  pinkLight: '#D94FB3',
  purple: '#542099',
  purpleDark: '#3F1777',
  purpleLight: '#7C3CC7',

  // Gradient
  gradientStart: '#7C2DCA',
  gradientEnd: '#B83291',
  bgGradientStart: '#F7F4FF',
  bgGradientEnd: '#F6F7FB',

  // Text
  textPrimary: '#172033',
  textSecondary: '#4B5870',
  textMuted: '#7A869A',

  border: '#DDE3EE',
  primary: '#B83291',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(15, 23, 42, 0.48)',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#EEF2F7',
  surfaceMuted: '#F1F4F8',
  accentSoft: '#F7E8F3',
  accentBorder: '#E9B9DC',
  shadowColor: '#64748B',

  // Status
  success: '#047857',
  error: '#DC2626',
  warning: '#B45309',
  info: '#2563EB',
  successSoft: '#DFF7EC',
  errorSoft: '#FEE2E2',
  warningSoft: '#FEF3C7',
  infoSoft: '#DBEAFE',

  // Extras
  imagePlaceholder: '#EEF2F7',
  purpleGlow: 'rgba(84, 32, 153, 0.06)',
  pinkGlow: 'rgba(184, 50, 145, 0.06)',
  dividerLine: '#E6EAF1',
  inputBorder: '#CBD5E1',
  toastBorder: '#DDE3EE',
  itemSeparator: '#E6EAF1',
};

// ═══════════════════════════════════
// Green Light Theme Colors
// ═══════════════════════════════════
export const GreenLightColors = {
  ...LightColors,
  background: '#F6FAF7',
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#EAF4EE',
  surfaceMuted: '#EEF7F2',
  FormBg: '#F8FCFA',
  pink: '#047857',
  pinkLight: '#10B981',
  purple: '#0F766E',
  purpleDark: '#065F46',
  purpleLight: '#2DD4BF',
  gradientStart: '#047857',
  gradientEnd: '#0F766E',
  bgGradientStart: '#F0FDF4',
  bgGradientEnd: '#F6FAF7',
  primary: '#047857',
  cardBorder: '#D6E6DD',
  border: '#D6E6DD',
  inputBorder: '#BBD4C6',
  accentSoft: '#E2F5EA',
  accentBorder: '#A7E3C4',
  purpleGlow: 'rgba(15, 118, 110, 0.06)',
  pinkGlow: 'rgba(4, 120, 87, 0.06)',
};

// ═══════════════════════════════════
// Navy Theme Colors (Navy, Blue, and Baby Blue)
// ═══════════════════════════════════
export const NavyDarkColors = {
  ...DarkColors,
  background: '#070B19', // Deep navy black
  backgroundSecondary: '#0F172A', // Navy slate
  card: 'rgba(15, 23, 42, 0.6)', // Sleek semi-transparent card
  cardBorder: 'rgba(56, 189, 248, 0.08)', // Glowing blue border
  glass: 'rgba(15, 23, 42, 0.4)',
  glassHighlight: 'rgba(56, 189, 248, 0.05)',
  FormBg: 'rgba(15, 23, 42, 0.25)',

  // Accents
  pink: '#38BDF8', // Baby Blue primary accent
  pinkLight: '#7DD3FC',
  purple: '#2563EB', // Cobalt Blue secondary accent
  purpleDark: '#1D4ED8',
  purpleLight: '#60A5FA',

  // Gradients
  gradientStart: '#38BDF8', // Baby Blue
  gradientEnd: '#2563EB', // Cobalt Blue
  bgGradientStart: '#0B1530', // Deep ocean/navy blue glow
  bgGradientEnd: '#030712', // Pure deep navy/black

  // Text
  textPrimary: '#F0F9FF', // Cool icy white
  textSecondary: '#93C5FD', // Soft sky blue
  textMuted: '#64748B', // Slate gray
  border: '#1E293B',
  primary: '#38BDF8',

  // Surfaces & Utilities
  surface: '#0B1329',
  surfaceElevated: '#0F172A',
  surfacePressed: 'rgba(56, 189, 248, 0.12)',
  surfaceMuted: 'rgba(56, 189, 248, 0.06)',
  accentSoft: 'rgba(56, 189, 248, 0.12)',
  accentBorder: 'rgba(56, 189, 248, 0.25)',
  purpleGlow: 'rgba(37, 99, 235, 0.15)',
  pinkGlow: 'rgba(56, 189, 248, 0.15)',
  dividerLine: 'rgba(56, 189, 248, 0.08)',
  inputBorder: 'rgba(56, 189, 248, 0.18)',
  toastBorder: 'rgba(56, 189, 248, 0.12)',
};

export const NavyLightColors = {
  ...LightColors,
  background: '#F0F5FA', // Off-white soft ice blue
  backgroundSecondary: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#D2E2F0', // Soft steel blue border
  glass: '#FFFFFF',
  glassHighlight: '#F1F7FC',
  FormBg: '#F1F7FC',

  // Accents
  pink: '#0284C7', // Stronger sky blue for light mode contrast
  pinkLight: '#0EA5E9',
  purple: '#1E3A8A', // Deep navy
  purpleDark: '#172554',
  purpleLight: '#3B82F6',

  // Gradients
  gradientStart: '#0284C7',
  gradientEnd: '#1E3A8A',
  bgGradientStart: '#EBF4FD', // Warm ice blue gradient
  bgGradientEnd: '#F0F5FA',

  // Text
  textPrimary: '#0F172A', // Dark slate
  textSecondary: '#334155', // Medium slate
  textMuted: '#64748B', // Slate gray
  border: '#D2E2F0',
  primary: '#0284C7',

  // Surfaces & Utilities
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#E0EEFB',
  surfaceMuted: '#E6F2FD',
  accentSoft: '#E0F2FE',
  accentBorder: '#BAE6FD',
  purpleGlow: 'rgba(30, 58, 138, 0.05)',
  pinkGlow: 'rgba(2, 132, 199, 0.05)',
  dividerLine: '#E2E8F0',
  inputBorder: '#94A3B8',
  toastBorder: '#CBD5E1',
};

export type ThemeColors = typeof DarkColors;
export type ThemeVariant = 'traditional' | 'green' | 'navy';

export function getColors(isDark: boolean, variant: ThemeVariant = 'traditional'): ThemeColors {
  if (variant === 'green') {
    return isDark ? GreenDarkColors : GreenLightColors;
  }
  if (variant === 'navy') {
    return isDark ? NavyDarkColors : NavyLightColors;
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
