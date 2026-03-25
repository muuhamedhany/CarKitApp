import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function Divider({ text = 'Or' }: { text?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>{text}</Text>
      <View style={styles.line} />
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
    backgroundColor: 'rgba(156, 39, 176, 0.2)',
  },
  text: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginHorizontal: Spacing.md,
  },
});
