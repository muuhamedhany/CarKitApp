import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';

type AuthFooterProps = {
  message: string;
  actionText: string;
  onPress: () => void;
};

export default function AuthFooter({ message, actionText, onPress }: AuthFooterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}  </Text>
      <Pressable onPress={onPress}>
        <Text style={styles.action}>{actionText}</Text>
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
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
  },
  action: {
    color: Colors.pink,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
});
