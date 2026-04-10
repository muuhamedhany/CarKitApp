import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { BackButton } from '@/components';
import { ThemeMode } from '@/contexts/ThemeContext';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string; description: string }[] = [
  { mode: 'light', label: 'Light', icon: 'white-balance-sunny', description: 'Always use light theme' },
  { mode: 'dark', label: 'Dark', icon: 'moon-waning-crescent', description: 'Always use dark theme' },
  { mode: 'system', label: 'System Default', icon: 'cellphone', description: 'Follow device settings' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton />

      <View style={[styles.content, { paddingTop: Platform.OS === 'ios' ? 12 : 24 }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* Appearance Section */}
        <Text style={[styles.sectionLabel, { color: colors.pink }]}>APPEARANCE</Text>
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          {THEME_OPTIONS.map((option, index) => {
            const isSelected = themeMode === option.mode;
            return (
              <Pressable
                key={option.mode}
                style={[
                  styles.themeOption,
                  index < THEME_OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.itemSeparator },
                  isSelected && { backgroundColor: colors.pinkGlow },
                ]}
                onPress={() => setThemeMode(option.mode)}
              >
                <View style={[styles.optionIcon, { backgroundColor: colors.purpleGlow }]}>
                  <MaterialCommunityIcons name={option.icon as any} size={22} color={isSelected ? colors.pink : colors.textMuted} />
                </View>
                <View style={styles.optionText}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }, isSelected && { color: colors.pink }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textMuted }]}>{option.description}</Text>
                </View>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={22} color={colors.pink} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Current mode indicator */}
        <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <MaterialCommunityIcons
            name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
            size={20}
            color={colors.purpleLight}
          />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Currently using <Text style={{ color: colors.pink, fontFamily: Fonts.bold }}>{isDark ? 'Dark' : 'Light'}</Text> mode
          </Text>
        </View>

        {/* Security Section */}
        <Text style={[styles.sectionLabel, { color: colors.pink }]}>SECURITY</Text>
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <Pressable
            style={styles.themeOption}
            onPress={() => router.push('/settings/password')}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.purpleGlow }]}>
              <MaterialCommunityIcons name="lock-reset" size={22} color={colors.pink} />
            </View>
            <View style={styles.optionText}>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Change Password</Text>
              <Text style={[styles.optionDesc, { color: colors.textMuted }]}>Update your account password</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionLabel, { color: colors.pink }]}>ABOUT</Text>
        <View style={[styles.section, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>1.0.0</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, flex: 1 },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sectionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionText: { flex: 1 },
  optionLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  optionDesc: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
  },
  aboutLabel: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.md,
  },
  aboutValue: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
});
