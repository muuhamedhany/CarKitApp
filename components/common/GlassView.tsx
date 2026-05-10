import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

interface GlassViewProps extends ViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

/**
 * A reusable glass-morphism component that provides a blurred background effect.
 * On Android, BlurView renders as dark opaque rectangles, so we fall back to a
 * simple translucent background that closely approximates the glass look.
 */
export default function GlassView({
  children,
  style,
  intensity = 40,
  tint = 'default',
  ...props
}: GlassViewProps) {
  const isAndroid = Platform.OS === 'android';

  // On Android, compute a fallback background based on tint + intensity
  const androidBg =
    tint === 'dark'
      ? `rgba(20, 20, 30, ${Math.min(0.55 + intensity * 0.003, 0.85)})`
      : tint === 'light'
        ? `rgba(255, 255, 255, ${Math.min(0.5 + intensity * 0.004, 0.92)})`
        : `rgba(130, 130, 140, ${Math.min(0.3 + intensity * 0.003, 0.7)})`;

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
