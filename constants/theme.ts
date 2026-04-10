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
// Dark Theme Colors
// ═══════════════════════════════════
export const DarkColors = {
  // Backgrounds
  background: '#050505', // Deep Obsidian
  backgroundSecondary: '#0D0D0F', // Slightly lighter for contrast
  card: 'rgba(20, 20, 25, 0.4)', // Glassmorphic base
  cardBorder: 'rgba(255, 255, 255, 0.08)', // High-end subtle border

  // Primary
  pink: '#CD42A8',
  pinkLight: '#FF69B4',
  purple: '#5923A0',
  purpleDark: '#7B2FBE',
  purpleLight: '#B388FF',

  // Gradient
  gradientStart: '#CD42A8',
  gradientEnd: '#5923A0',

  // Text
  textPrimary: '#E9DEF8',
  textSecondary: '#AA9DBB',
  textMuted: '#6B6B80',

  border: '#2A2A3A',
  primary: '#CD42A8',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.7)',
  surface: '#1E1E2C',

  // Status
  success: '#4CAF50',
  error: '#FF4757',
  warning: '#FFA502',
  info: '#2196F3',

  // Extras for image/placeholder backgrounds
  imagePlaceholder: 'rgba(255, 255, 255, 0.05)',
  purpleGlow: 'rgba(147, 51, 234, 0.12)', // Refined violet
  pinkGlow: 'rgba(236, 72, 153, 0.12)', // Refined fuchsia
  dividerLine: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(255, 255, 255, 0.1)',
  toastBorder: 'rgba(255, 255, 255, 0.05)',
  itemSeparator: 'rgba(255, 255, 255, 0.04)',
};

// ═══════════════════════════════════
// Light Theme Colors
// ═══════════════════════════════════
export const LightColors = {
  // Backgrounds
  background: '#F5F5FA',
  backgroundSecondary: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.9)',
  cardBorder: 'rgba(156, 39, 176, 0.2)',

  // Primary (same neon accents!)
  pink: '#CD42A8',
  pinkLight: '#FF69B4',
  purple: '#5923A0',
  purpleDark: '#7B2FBE',
  purpleLight: '#5923A0',

  // Gradient
  gradientStart: '#5923A0',
  gradientEnd: '#CD42A8',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B80',
  textMuted: '#9E9E9E',

  border: '#E0E0E8',
  primary: '#CD42A8',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0,0,0,0.4)',
  surface: '#FFFFFF',

  // Status
  success: '#4CAF50',
  error: '#FF4757',
  warning: '#FFA502',
  info: '#2196F3',

  // Extras
  imagePlaceholder: 'rgba(156,39,176,0.06)',
  purpleGlow: 'rgba(156,39,176,0.08)',
  pinkGlow: 'rgba(233,30,140,0.08)',
  dividerLine: 'rgba(156, 39, 176, 0.15)',
  inputBorder: 'rgba(156, 39, 176, 0.3)',
  toastBorder: 'rgba(0, 0, 0, 0.08)',
  itemSeparator: 'rgba(0,0,0,0.06)',
};

// Type for color palette
export type ThemeColors = typeof DarkColors;

// Helper to get colors based on mode
export function getColors(isDark: boolean): ThemeColors {
  return isDark ? DarkColors : LightColors;
}

// Legacy export — now defaults to dark for backward compatibility
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
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};
