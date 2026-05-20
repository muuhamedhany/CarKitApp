import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, GlassView, GradientButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { rowDirection, textAlign } from '@/utils/rtl';

interface PrivacySection {
  icon: string;
  titleKey: string;
  contentKey: string;
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    icon: 'database-search-outline',
    titleKey: 'settings.privacy.section1.title',
    contentKey: 'settings.privacy.section1.content',
  },
  {
    icon: 'cog-transfer-outline',
    titleKey: 'settings.privacy.section2.title',
    contentKey: 'settings.privacy.section2.content',
  },
  {
    icon: 'share-variant-outline',
    titleKey: 'settings.privacy.section3.title',
    contentKey: 'settings.privacy.section3.content',
  },
  {
    icon: 'shield-lock-outline',
    titleKey: 'settings.privacy.section4.title',
    contentKey: 'settings.privacy.section4.content',
  },
  {
    icon: 'account-cog-outline',
    titleKey: 'settings.privacy.section5.title',
    contentKey: 'settings.privacy.section5.content',
  },
  {
    icon: 'delete-empty-outline',
    titleKey: 'settings.privacy.section6.title',
    contentKey: 'settings.privacy.section6.content',
  }
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric depth orbs */}
      <View style={[styles.orb, { top: -120, left: -120, backgroundColor: colors.purple + '15' }]} />
      <View style={[styles.orb, { bottom: 100, right: -150, backgroundColor: colors.pink + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredHeader
          title={t('settings.privacy.title')}
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerInfo}>
          <View style={[styles.iconWrap, { backgroundColor: colors.pink + '15' }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={32} color={colors.pink} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('settings.privacy.header')}</Text>
          <Text style={[styles.headerDesc, { color: colors.textMuted, textAlign: textAlign(isRTL) }]}>
            {t('settings.privacy.description')}
          </Text>
        </Animated.View>

        <View style={styles.list}>
          {PRIVACY_SECTIONS.map((section, idx) => (
            <Animated.View 
              key={idx} 
              entering={FadeInDown.delay(150 + idx * 50).springify()}
            >
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                <View style={[styles.cardHeader, { flexDirection: rowDirection(isRTL) }]}>
                  <View style={[styles.cardIconWrap, { backgroundColor: colors.pink + '12' }]}>
                    <MaterialCommunityIcons name={section.icon as any} size={20} color={colors.pink} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t(section.titleKey)}</Text>
                </View>
                <Text style={[styles.cardContent, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
                  {t(section.contentKey)}
                </Text>
              </GlassView>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.footerSection}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {t('settings.legal.lastUpdated')}
          </Text>
          <GradientButton
            title={t('settings.privacy.consent')}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            style={styles.actionBtn}
            icon="shield-lock-outline"
          />
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 40 },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  headerInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg + 2,
    marginBottom: 8,
  },
  headerDesc: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },

  list: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    flex: 1,
  },
  cardContent: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    opacity: 0.9,
  },

  footerSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  footerText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    opacity: 0.6,
  },
  actionBtn: {
    width: '100%',
  }
});
