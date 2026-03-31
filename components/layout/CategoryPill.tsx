import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type CategoryPillProps = {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
};

export default function CategoryPill({ label, isActive = false, onPress }: CategoryPillProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={[
        styles.pill,
        { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder },
        isActive && { backgroundColor: colors.pink, borderColor: colors.pink },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary },
          isActive && { color: '#FFFFFF' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  label: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
});
