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
  const { colors, isDark } = useTheme();
  const isAndroid = Platform.OS === 'android';

  const solidBg =
    tint === 'dark'
      ? colors.backgroundSecondary
      : tint === 'light'
        ? colors.surfaceElevated
        : colors.surface;

  const shouldBlur = !isAndroid && isDark;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: solidBg, borderColor: colors.cardBorder },
        style,
      ]}
      {...props}
    >
      {shouldBlur && (
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
  },
});
