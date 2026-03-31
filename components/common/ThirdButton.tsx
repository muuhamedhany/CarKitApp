import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

type ThirdButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function ThirdButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}: ThirdButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, { backgroundColor: colors.pink }, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
});
