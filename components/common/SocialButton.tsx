import { Pressable, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import Text from '@/components/common/LocalizedText';

type SocialButtonProps = {
  provider: 'google';
  actionText: string;
  onPress?: () => void;
};

export default function SocialButton({ provider, actionText, onPress }: SocialButtonProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Pressable style={[styles.button, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]} onPress={onPress}>
      <Image 
        source={{ uri: 'https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png' }} 
        style={styles.logo} 
      />
      <Text style={[styles.text, { color: colors.textPrimary }]}>{t(actionText)}</Text>
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
    borderWidth: 1,
  },
  logo: {
    width: 24,
    height: 24,
    marginEnd: Spacing.sm,
  },
  text: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
});
