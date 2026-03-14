import { Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type Props = {
  label: string;
  icon?: string;
  isActive?: boolean;
  onPress?: () => void;
};

export default function CategoryPill({ label, icon, isActive = false, onPress }: Props) {
  return (
    <Pressable
      style={[styles.pill, isActive && styles.pillActive]}
      onPress={onPress}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon as any}
          size={18}
          color={isActive ? Colors.pink : Colors.textSecondary}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
    backgroundColor: 'transparent',
  },
  pillActive: {
    borderColor: Colors.pink,
    backgroundColor: 'rgba(233, 30, 140, 0.1)',
  },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.medium,
  },
  labelActive: {
    color: Colors.pink,
  },
});
