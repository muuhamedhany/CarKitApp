import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type SocialButtonProps = {
  provider: 'google';
  actionText: string;
  onPress?: () => void;
};

export default function SocialButton({ provider, actionText, onPress }: SocialButtonProps) {
  const { colors, isDark } = useTheme();

  return (
    <Pressable style={[styles.button, { backgroundColor: isDark ? '#FFFFFF' : '#F5F5F5', borderColor: isDark ? 'transparent' : colors.border, borderWidth: isDark ? 0 : 1 }]} onPress={onPress}>
      <Image 
        source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} 
        style={styles.logo} 
      />
      <Text style={[styles.text, { color: '#1A1A2E' }]}>{actionText}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
  },
  text: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
});
