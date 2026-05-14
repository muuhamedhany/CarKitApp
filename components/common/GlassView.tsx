import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface GlassViewProps extends ViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

/**
 * A reusable glass-morphism component that provides a blurred background effect.
 * On Android, BlurView renders as dark opaque rectangles, so we fall back to a
 * solid background for better performance and consistency.
 */
export default function GlassView({
  children,
  style,
  intensity = 40,
  tint = 'default',
  ...props
}: GlassViewProps) {
  const { colors } = useTheme();
  const isAndroid = Platform.OS === 'android';

  // On Android, use solid background colors from the theme instead of blur
  const androidBg =
    tint === 'dark'
      ? colors.backgroundSecondary // Deep solid dark
      : tint === 'light'
        ? colors.background // Solid light
        : colors.surface; // Default surface color

  return (
    <View
      style={[
        styles.container,
        isAndroid && { backgroundColor: androidBg },
        style,
      ]}
      {...props}
    >
      {!isAndroid && (
        <BlurView
          intensity={intensity}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // iOS fallback for non-blur environments
  },
});
