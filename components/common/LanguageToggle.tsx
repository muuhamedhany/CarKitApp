import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation, Language } from '@/contexts/LanguageContext';
import { Fonts, BorderRadius } from '@/constants/theme';
import Text from '@/components/common/LocalizedText';

/**
 * A compact pill toggle that switches between English and Arabic.
 * Designed for the top-right corner of auth screens (login, sign-up, etc.).
 * Uses the same changeLanguage() as settings — will show the restart alert
 * when the RTL direction needs to flip.
 */
export default function LanguageToggle() {
  const { colors } = useTheme();
  const { language, changeLanguage } = useTranslation();

  const isArabic = language === 'ar';

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next: Language = isArabic ? 'en' : 'ar';
    changeLanguage(next);
  };

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: colors.pink + '18',
          borderColor: colors.pink + '55',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      hitSlop={8}
    >
      {/* Left option */}
      <View style={[styles.option, !isArabic && { backgroundColor: colors.pink }]}>
        <Text style={[styles.label, { color: !isArabic ? '#fff' : colors.textMuted }]}>EN</Text>
      </View>

      {/* Right option */}
      <View style={[styles.option, isArabic && { backgroundColor: colors.pink }]}>
        <Text style={[styles.label, { color: isArabic ? '#fff' : colors.textMuted }]}>ع</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full ?? 999,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});
