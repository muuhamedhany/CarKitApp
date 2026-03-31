import { Pressable, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

type AddButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AddButton({
  title,
  onPress,
  disabled = false,
  style,
}: AddButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { borderColor: colors.purple, backgroundColor: colors.transparent }, disabled && styles.disabled, style]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.purple }]}>
        <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
      </View>
      <Text style={[styles.text, { color: colors.purple }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  disabled: {
    opacity: 0.6,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
});
