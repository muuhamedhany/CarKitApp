import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeMode } from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string; description: string }[] = [
  { mode: 'light', label: 'Light', icon: 'white-balance-sunny', description: 'Always use light theme' },
  { mode: 'dark', label: 'Dark', icon: 'moon-waning-crescent', description: 'Always use dark theme' },
  { mode: 'system', label: 'System', icon: 'cellphone', description: 'Follow device settings' },
];

const THEME_VARIANTS = [
  {
    variant: 'traditional',
    label: 'Neon',
    description: 'Pink & Purple',
    previewColors: ['#CD42A8', '#7F39FB'],
  },
  {
    variant: 'green',
    label: 'Emerald',
    description: 'Green & Mint',
    previewColors: ['#10B981', '#059669'],
  },
  {
    variant: 'navy',
    label: 'Ocean',
    description: 'Navy & Blue',
    previewColors: ['#1E3A8A', '#3B82F6'],
  },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode, themeVariant, setThemeVariant } = useTheme();
  const { user, logout } = useAuth();

  const handleThemeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeMode(mode);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
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
      style={[styles.optionRow, !isLast && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={[styles.optionIcon, { backgroundColor: (color || colors.purple) + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color || colors.pink} />
      </View>
      <View style={styles.optionText}>
        <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{desc}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
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
          title="Settings"
          titleColor={colors.textPrimary}
        />

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>Account</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            {renderSettingRow('lock-outline', 'Security', 'Change password and privacy', () => router.push('/settings/password'), true)}
          </GlassView>
        </Animated.View>

        {/* Appearance Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>Appearance</Text>
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
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.variantContainer}>
              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} />
              <Text style={[styles.subLabel, { color: colors.textMuted }]}>Theme Style Variant</Text>
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
                            {option.label}
                          </Text>
                          <Text style={[styles.variantDesc, { color: colors.textMuted }]}>
                            {option.description}
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

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>Support & Info</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            {renderSettingRow('help-circle-outline', 'Help Center', 'FAQs and customer support', () => router.push('/support'))}
            {renderSettingRow('file-document-outline', 'Terms of Service', 'Read our usage guidelines', () => router.push('/settings/terms' as any))}
            {renderSettingRow('shield-check-outline', 'Privacy Policy', 'How we protect your data', () => router.push('/settings/privacy' as any), true)}
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
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerVersion, { color: colors.textMuted }]}>CarKit v1.0.0</Text>
          <Text style={[styles.footerBuild, { color: colors.textMuted }]}>Build #20240507.1</Text>
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
