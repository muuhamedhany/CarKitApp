import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

type OutlinedButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function OutlinedButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}: OutlinedButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { borderColor: colors.pink, backgroundColor: colors.transparent }, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={colors.pink} />
      ) : (
        <Text style={[styles.text, { color: colors.pink }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
});
