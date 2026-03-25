import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type CategoryPillProps = {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
};

export default function CategoryPill({ label, isActive, onPress }: CategoryPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.pill, isActive && styles.pillActive]}
    >
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: 'transparent',
    marginRight: Spacing.sm,
  },
  pillActive: {
    backgroundColor: Colors.pink,
    borderColor: Colors.pink,
  },
  label: {
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  labelActive: {
    color: Colors.white,
  },
});
