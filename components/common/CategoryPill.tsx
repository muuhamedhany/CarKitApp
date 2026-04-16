import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type CategoryPillProps = {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
};

export default function CategoryPill({ label, isActive, onPress }: CategoryPillProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.pill,
        animatedStyle,
        { borderColor: colors.cardBorder, backgroundColor: 'transparent' },
        isActive && { backgroundColor: colors.pink, borderColor: colors.pink },
      ]}
    >
      <Text style={[
        styles.label,
        { color: colors.textSecondary },
        isActive && { color: '#FFFFFF' },
      ]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
});
