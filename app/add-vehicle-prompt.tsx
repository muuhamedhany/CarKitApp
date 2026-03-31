import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function AddVehiclePromptScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.pink }]}>Have a Car?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Add it to Personalize your Experience</Text>

        <Pressable
          style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => router.push('/add-vehicle-signup')}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.purpleGlow }]}>
            <MaterialCommunityIcons name="account-plus-outline" size={28} color={colors.purpleLight} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Add Now</Text>
            <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>Go to Car Form</Text>
          </View>
        </Pressable>

        <Pressable
          style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.purpleGlow }]}>
            <MaterialCommunityIcons name="briefcase-outline" size={28} color={colors.purpleLight} />
          </View>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: colors.textPrimary }]}>Later</Text>
            <Text style={[styles.optionSubtitle, { color: colors.textMuted }]}>Go to Login</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl },
  content: { alignItems: 'center' },
  title: { fontSize: 32, fontFamily: Fonts.bold, marginBottom: Spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: FontSizes.md, fontFamily: Fonts.regular, marginBottom: Spacing.xxl, textAlign: 'center' },
  optionCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.lg, borderWidth: 1, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: FontSizes.lg, fontFamily: Fonts.bold },
  optionSubtitle: { fontSize: FontSizes.sm, fontFamily: Fonts.regular, marginTop: 2 },
});
