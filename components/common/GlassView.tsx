import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface GlassViewProps extends ViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

/**
 * A reusable glass-morphism component that provides a blurred background effect.
 */
export default function GlassView({
  children,
  style,
  intensity = 40,
  tint = 'default',
  ...props
}: GlassViewProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Fallback for non-blur supporting environments
  },
});
