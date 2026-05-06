import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius, Shadows, Colors } from '@/constants/theme';

type CategoryPillProps = {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CategoryPill({ label, isActive = false, onPress }: CategoryPillProps) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      style={[
        styles.pill,
        { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)', 
          borderColor: colors.cardBorder 
        },
        isActive && [
          styles.activePill,
          { 
            backgroundColor: colors.pink, 
            borderColor: colors.pink,
            ...Shadows.sm,
            shadowColor: colors.pink
          }
        ],
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary },
          isActive && styles.activeLabel,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePill: {
    // Additional active styles if needed
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 0.2,
  },
  activeLabel: {
    color: '#FFFFFF',
    fontFamily: Fonts.extraBold,
  },
});
