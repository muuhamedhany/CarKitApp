import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { ThemeMode } from '@/contexts/ThemeContext';
import { useTheme } from '@/hooks/useTheme';

const { width, height } = Dimensions.get('window');

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string; description: string }[] = [
  { mode: 'light', label: 'Light', icon: 'white-balance-sunny', description: 'Always use light theme' },
  { mode: 'dark', label: 'Dark', icon: 'moon-waning-crescent', description: 'Always use dark theme' },
  { mode: 'system', label: 'System Default', icon: 'cellphone', description: 'Follow device settings' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  const handleThemeChange = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setThemeMode(mode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <CenteredHeader
        title="Settings"
        titleColor={colors.textPrimary}
        rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Appearance Section */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>APPEARANCE</Text>
          <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            {THEME_OPTIONS.map((option, index) => {
              const isSelected = themeMode === option.mode;
              return (
                <Pressable
                  key={option.mode}
                  style={[
                    styles.optionRow,
                    index < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
                    isSelected && { backgroundColor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.05)' },
                  ]}
                  onPress={() => handleThemeChange(option.mode)}
                >
                  <View style={[styles.optionIcon, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)' }]}>
                    <MaterialCommunityIcons name={option.icon as any} size={22} color={isSelected ? colors.pink : colors.textMuted} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, { color: colors.textPrimary }, isSelected && { color: colors.pink, fontFamily: Fonts.bold }]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{option.description}</Text>
                  </View>
                  {isSelected && (
                    <Animated.View entering={FadeInLeft}>
                      <MaterialCommunityIcons name="check-circle" size={24} color={colors.pink} />
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </GlassView>
        </Animated.View>

        {/* Current mode indicator */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <View style={[styles.infoIconWrap, { backgroundColor: colors.purple + '20' }]}>
              <MaterialCommunityIcons
                name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
                size={20}
                color={colors.purple}
              />
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Currently using <Text style={{ color: colors.pink, fontFamily: Fonts.bold }}>{isDark ? 'Dark' : 'Light'}</Text> mode
            </Text>
          </GlassView>
        </Animated.View>

        {/* Security Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>SECURITY</Text>
          <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            <Pressable
              style={styles.optionRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings/password');
              }}
            >
              <View style={[styles.optionIcon, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.1)' }]}>
                <MaterialCommunityIcons name="lock-reset" size={22} color={colors.pink} />
              </View>
              <View style={styles.optionText}>
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Change Password</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Update your account password</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>
          </GlassView>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={[styles.sectionLabel, { color: colors.pink }]}>ABOUT</Text>
          <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.sectionCard}>
            <View style={styles.aboutRow}>
              <View style={styles.aboutInfo}>
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Version</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Latest stable release</Text>
              </View>
              <View style={[styles.versionBadge, { backgroundColor: colors.pink + '20' }]}>
                <Text style={[styles.versionText, { color: colors.pink }]}>1.0.0</Text>
              </View>
            </View>
            <View style={[styles.aboutRow, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }]}>
              <View style={styles.aboutInfo}>
                <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Build Number</Text>
                <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Internal reference</Text>
              </View>
              <Text style={[styles.aboutValue, { color: colors.textSecondary }]}>#20240507.1</Text>
            </View>
          </GlassView>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
    marginLeft: 8,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    letterSpacing: 0.5,
  },
  optionDesc: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.md,
    gap: Spacing.md,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    opacity: 0.9,
  },

  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.lg,
  },
  aboutInfo: { flex: 1 },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  versionText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  aboutValue: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    opacity: 0.6,
  },
});
