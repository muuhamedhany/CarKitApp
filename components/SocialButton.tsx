import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type SocialButtonProps = {
  provider: 'google';
  actionText: string;
  onPress?: () => void;
};

export default function SocialButton({ provider, actionText, onPress }: SocialButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Image 
        source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} 
        style={styles.logo} 
      />
      <Text style={styles.text}>{actionText}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: Spacing.sm,
  },
  text: {
    color: Colors.black,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
});
