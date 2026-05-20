import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { Language, useTranslation } from '@/contexts/LanguageContext';
import { ThemeMode } from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/useTheme';
import { supportedLanguages } from '@/locales';
import { chevronForward, rowDirection, textAlign } from '@/utils/rtl';

const THEME_OPTIONS: { mode: ThemeMode; labelKey: string; icon: string; descriptionKey: string }[] = [
  { mode: 'light', labelKey: 'settings.theme.light', icon: 'white-balance-sunny', descriptionKey: 'settings.theme.lightDesc' },
  { mode: 'dark', labelKey: 'settings.theme.dark', icon: 'moon-waning-crescent', descriptionKey: 'settings.theme.darkDesc' },
  { mode: 'system', labelKey: 'settings.theme.system', icon: 'cellphone', descriptionKey: 'settings.theme.systemDesc' },
];

const THEME_VARIANTS = [
  {
    variant: 'traditional',
    labelKey: 'settings.variant.neon',
    descriptionKey: 'settings.variant.neonDesc',
    previewColors: ['#CD42A8', '#7F39FB'],
  },
  {
    variant: 'green',
    labelKey: 'settings.variant.emerald',
    descriptionKey: 'settings.variant.emeraldDesc',
    previewColors: ['#10B981', '#059669'],
  },
  {
    variant: 'navy',
    labelKey: 'settings.variant.ocean',
    descriptionKey: 'settings.variant.oceanDesc',
    previewColors: ['#1E3A8A', '#3B82F6'],
  },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, themeMode, setThemeMode, themeVariant, setThemeVariant } = useTheme();
  const { logout } = useAuth();
  const { t, language, changeLanguage, isRTL } = useTranslation();

  const handleThemeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeMode(mode);
  };

  const handleLanguageChange = (nextLanguage: Language) => {
    if (nextLanguage === language) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    changeLanguage(nextLanguage);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      t('settings.signOut'),
      t('settings.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.signOut'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const renderSettingRow = (icon: string, label: string, desc: string, onPress: () => void, isLast = false, color?: string) => (
    <Pressable
      style={[
        styles.optionRow,
        { flexDirection: rowDirection(isRTL) },
        !isLast && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor: (color || colors.purple) + '15',
            marginLeft: isRTL ? Spacing.md : 0,
            marginRight: isRTL ? 0 : Spacing.md,
          },
        ]}
      >
        <MaterialCommunityIcons name={icon as any} size={22} color={color || colors.pink} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionLabel, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{label}</Text>
        <Text style={[styles.optionDesc, { color: colors.textMuted, textAlign: textAlign(isRTL) }]}>{desc}</Text>
      </View>
      <MaterialCommunityIcons name={chevronForward(isRTL) as any} size={24} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Background Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredHeader
          title={t('settings.title')}
          titleColor={colors.textPrimary}
        />

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink, textAlign: textAlign(isRTL) }]}>{t('settings.account')}</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            {renderSettingRow('lock-outline', t('settings.security'), t('settings.securityDesc'), () => router.push('/settings/password'), true)}
          </GlassView>
        </Animated.View>

        {/* Appearance Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink, textAlign: textAlign(isRTL) }]}>{t('settings.appearance')}</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            <View style={styles.themeSelector}>
              {THEME_OPTIONS.map((option) => {
                const isSelected = themeMode === option.mode;
                return (
                  <Pressable
                    key={option.mode}
                    style={[
                      styles.themeChip,
                      isSelected && { backgroundColor: colors.pink + '20', borderColor: colors.pink }
                    ]}
                    onPress={() => handleThemeChange(option.mode)}
                  >
                    <MaterialCommunityIcons
                      name={option.icon as any}
                      size={20}
                      color={isSelected ? colors.pink : colors.textMuted}
                    />
                    <Text
                      style={[styles.themeChipLabel, { color: isSelected ? colors.pink : colors.textSecondary }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {t(option.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.variantContainer}>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
              <Text style={[styles.subLabel, { color: colors.textMuted, textAlign: textAlign(isRTL) }]}>{t('settings.themeVariant')}</Text>
              <View style={styles.variantGrid}>
                {THEME_VARIANTS.map((option) => {
                  const isSelected = themeVariant === option.variant;
                  return (
                    <Pressable
                      key={option.variant}
                      style={styles.variantItem}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setThemeVariant(option.variant as any);
                      }}
                    >
                      <View style={[
                        styles.variantCardInner,
                        {
                          borderColor: isSelected ? colors.pink : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
                            : 'transparent'
                        }
                      ]}>
                        <LinearGradient
                          colors={option.previewColors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.variantPreview}
                        />
                        <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                          <Text style={[styles.variantName, { color: isSelected ? colors.pink : colors.textPrimary }]}>
                            {t(option.labelKey)}
                          </Text>
                          <Text style={[styles.variantDesc, { color: colors.textMuted }]}>
                            {t(option.descriptionKey)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </GlassView>
        </Animated.View>

        {/* Language Section */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink, textAlign: textAlign(isRTL) }]}>{t('settings.language.title')}</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            <View style={styles.languageSelector}>
              {supportedLanguages.map((option) => {
                const isSelected = language === option.code;
                return (
                  <Pressable
                    key={option.code}
                    style={[
                      styles.languageOption,
                      {
                        flexDirection: rowDirection(isRTL),
                        borderColor: isSelected ? colors.pink : colors.cardBorder,
                        backgroundColor: isSelected ? colors.pink + '18' : 'transparent',
                      },
                    ]}
                    onPress={() => handleLanguageChange(option.code)}
                  >
                    <View style={styles.languageTextWrap}>
                      <Text style={[styles.languageLabel, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>
                        {t(option.labelKey)}
                      </Text>
                      <Text style={[styles.languageNative, { color: colors.textMuted, textAlign: textAlign(isRTL) }]}>
                        {t(option.nativeLabelKey)}
                      </Text>
                    </View>
                    {isSelected && <MaterialCommunityIcons name="check-circle" size={22} color={colors.pink} />}
                  </Pressable>
                );
              })}
            </View>
          </GlassView>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink, textAlign: textAlign(isRTL) }]}>{t('settings.supportInfo')}</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            {renderSettingRow('help-circle-outline', t('settings.helpCenter'), t('settings.helpCenterDesc'), () => router.push('/support'))}
            {renderSettingRow('file-document-outline', t('settings.terms'), t('settings.termsDesc'), () => router.push('/settings/terms' as any))}
            {renderSettingRow('shield-check-outline', t('settings.privacy'), t('settings.privacyDesc'), () => router.push('/settings/privacy' as any), true)}
          </GlassView>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: pressed ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)' }
            ]}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>{t('settings.signOut')}</Text>
          </Pressable>
        </Animated.View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>{t('settings.version')}</Text>
          <Text style={[styles.footerBuild, { color: colors.textMuted }]}>{t('settings.build')}</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: Fonts.extraBold,
    fontSize: 24,
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#050505',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  profileEmail: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    opacity: 0.7,
    marginTop: 2,
  },
  editProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionLabel: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
    marginLeft: 4,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    letterSpacing: 0.3,
  },
  optionDesc: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.5,
  },

  themeSelector: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  themeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  themeChipLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },

  variantContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  subLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: Spacing.md,
    opacity: 0.8,
  },
  variantGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  variantItem: {
    flex: 1,
  },
  variantCardInner: {
    borderRadius: BorderRadius.lg,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  variantPreview: {
    width: '100%',
    height: 38,
    borderRadius: 8,
    marginBottom: 6,
  },
  variantName: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 2,
  },
  variantDesc: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 11,
  },

  languageSelector: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  languageTextWrap: {
    flex: 1,
  },
  languageLabel: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  languageNative: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: BorderRadius.xl,
    marginTop: Spacing.xxl,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: '#EF4444',
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
    letterSpacing: 0.5,
  },

  footer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    opacity: 0.5,
  },
  footerVersion: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  footerBuild: {
    fontFamily: Fonts.medium,
    fontSize: 9,
    marginTop: 4,
  },
});
