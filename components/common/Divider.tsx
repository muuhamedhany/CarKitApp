import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function Divider({ text = 'Or' }: { text?: string }) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.line, { backgroundColor: colors.dividerLine }]} />
      <Text style={[styles.text, { color: colors.textMuted }]}>{text}</Text>
      <View style={[styles.line, { backgroundColor: colors.dividerLine }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
  },
  text: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginHorizontal: Spacing.md,
  },
});
