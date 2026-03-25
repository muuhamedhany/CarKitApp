import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

type SecondaryButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function SecondaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
}: SecondaryButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.wrapper, style]}>
      <LinearGradient
        colors={['#7B2FBE', '#9C27B0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  gradient: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
});
