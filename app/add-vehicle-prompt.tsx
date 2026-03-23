import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function AddVehiclePromptScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Have a Car?</Text>
        <Text style={styles.subtitle}>Add it to Personalize your Experience</Text>

        {/* Add Now */}
        <Pressable
          style={styles.optionCard}
          onPress={() => router.push('/add-vehicle-signup')}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="account-plus-outline" size={28} color={Colors.purpleLight} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Add Now</Text>
            <Text style={styles.optionSubtitle}>Go to Car Form</Text>
          </View>
        </Pressable>

        {/* Later */}
        <Pressable
          style={styles.optionCard}
          onPress={() => router.replace('/(tabs)')}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="briefcase-outline" size={28} color={Colors.purpleLight} />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionTitle}>Later</Text>
            <Text style={styles.optionSubtitle}>Go to Login</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: Colors.pink,
    fontSize: 32,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.xxl,
    textAlign: 'center',
  },
  optionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(156,39,176,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.textPrimary,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
  optionSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
