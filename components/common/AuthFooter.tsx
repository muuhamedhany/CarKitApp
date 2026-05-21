import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontSizes, Fonts } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { rowDirection } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';

type AuthFooterProps = {
  message: string;
  actionText: string;
  onPress: () => void;
};

export default function AuthFooter({ message, actionText, onPress }: AuthFooterProps) {
  const { colors } = useTheme();
  const { t, isRTL } = useTranslation();

  return (
    <View style={[styles.container, { flexDirection: rowDirection(isRTL) }]}>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{t(message)}  </Text>
      <Pressable onPress={onPress}>
        <Text style={[styles.action, { color: colors.pink }]}>{t(actionText)}</Text>
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
