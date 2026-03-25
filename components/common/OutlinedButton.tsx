import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

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
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.pink} />
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
    borderWidth: 1.5,
    borderColor: Colors.pink,
    backgroundColor: Colors.transparent,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: Colors.pink,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
});
