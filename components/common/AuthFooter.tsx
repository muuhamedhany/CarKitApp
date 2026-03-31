import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts } from '@/constants/theme';

type AuthFooterProps = {
  message: string;
  actionText: string;
  onPress: () => void;
};

export default function AuthFooter({ message, actionText, onPress }: AuthFooterProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}  </Text>
      <Pressable onPress={onPress}>
        <Text style={[styles.action, { color: colors.pink }]}>{actionText}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
  },
  action: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
});
