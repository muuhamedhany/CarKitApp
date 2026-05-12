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

const THEME_VARIANTS: { variant: string; label: string; description: string; previewColors: string[] }[] = [
  { variant: 'traditional', label: 'Traditional Neon', description: 'Classic Pink & Purple', previewColors: ['#CD42A8', '#5923A0'] },
  { variant: 'green', label: 'Emerald Mint', description: 'Olive & Mint Greens', previewColors: ['#10B981', '#4A5D23'] },
];

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

        {/* Profile Header Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={styles.profileCard}>
            <View style={[styles.avatarWrap, { backgroundColor: colors.pink + '20' }]}>
              <Text style={[styles.avatarText, { color: colors.pink }]}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
              <View style={[styles.roleBadge, { backgroundColor: colors.purple }]}>
                <MaterialCommunityIcons
                  name={user?.role === 'vendor' ? 'store' : user?.role === 'provider' ? 'wrench' : 'account'}
                  size={10}
                  color="white"
                />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'email@example.com'}</Text>
            </View>
            <Pressable
              style={[styles.editProfileBtn, { backgroundColor: 'rgba(255,255,255,0.05)' }]}
              onPress={() => router.push('/profile/edit')}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.textMuted} />
            </Pressable>
          </GlassView>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>Account</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            {renderSettingRow('map-marker-outline', 'Saved Addresses', 'Manage your delivery locations', () => router.push('/profile/addresses'))}
            {renderSettingRow('car-outline', 'My Vehicles', 'View and edit your cars', () => router.push('/my-vehicles'))}
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

            {isDark && (
              <View style={styles.variantContainer}>
                <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
                <Text style={[styles.subLabel, { color: colors.textMuted }]}>Dark Style Variant</Text>
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
                          { borderColor: isSelected ? colors.pink : 'rgba(255,255,255,0.1)' }
                        ]}>
                          <LinearGradient
                            colors={option.previewColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.variantPreview}
                          />
                          <Text style={[styles.variantName, { color: isSelected ? colors.pink : colors.textPrimary }]}>
                            {option.label}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </GlassView>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>Support & Info</Text>
          <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            {renderSettingRow('help-circle-outline', 'Help Center', 'FAQs and customer support', () => router.push('/support'))}
            {renderSettingRow('file-document-outline', 'Terms of Service', 'Read our usage guidelines', () => { })}
            {renderSettingRow('shield-check-outline', 'Privacy Policy', 'How we protect your data', () => { }, true)}
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
    fontFamily: Fonts.bold,
    fontSize: 11,
  },

  variantContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  subLabel: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    opacity: 0.5,
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
    padding: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  variantPreview: {
    width: '100%',
    height: 30,
    borderRadius: 6,
    marginBottom: 8,
  },
  variantName: {
    fontFamily: Fonts.bold,
    fontSize: 10,
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
