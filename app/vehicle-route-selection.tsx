import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

export default function VehicleRouteSelectionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Have a Car?</Text>
        <Text style={styles.subtitle}>Add it to Personalize your Experience</Text>

        {/* Add Now */}
        <Pressable
          style={styles.optionCard}
          onPress={() => router.push('/car-form' as any)}
        >
          <View style={styles.optionIcon}>
            <MaterialCommunityIcons name="account-plus-outline" size={28} color={Colors.purple} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Add Now</Text>
            <Text style={styles.optionDesc}>Go to Car Form</Text>
          </View>
        </Pressable>

        {/* Later */}
        <Pressable
          style={styles.optionCard}
          onPress={() => router.replace('/(tabs)' as any)}
        >
          <View style={styles.optionIcon}>
            <MaterialCommunityIcons name="shopping-outline" size={28} color={Colors.purple} />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Later</Text>
            <Text style={styles.optionDesc}>Go to Login</Text>
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
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  title: {
    color: Colors.pink,
    fontSize: 28,
    fontFamily: Fonts.extraBold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
  optionDesc: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
