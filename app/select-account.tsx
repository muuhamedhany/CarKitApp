import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

export default function SelectAccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Choose Account{'\n'}Type</Text>
        <Text style={styles.subtitle}>Select how you want to use CarKit</Text>

        {/* Customer Card */}
        <Pressable
          style={styles.card}
          onPress={() => router.push('/signup-customer')}
        >
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons name="account-outline" size={28} color={Colors.purpleLight} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Customer</Text>
            <Text style={styles.cardDescription}>
              Find trusted mechanics and quality parts.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textMuted} />
        </Pressable>

        {/* Vendor / Service Provider Card */}
        <Pressable
          style={styles.card}
          onPress={() => router.push('/signup-vendor')}
        >
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons name="store-outline" size={28} color={Colors.purpleLight} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Vendor/Service Provider</Text>
            <Text style={styles.cardDescription}>
              Grow your business and connect with customers.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textMuted} />
        </Pressable>

        {/* Login Link */}
        <View style={styles.bottomLink}>
          <Text style={styles.bottomLinkText}>Already have an account?  </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.bottomLinkAction}>Login</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  title: {
    color: Colors.pink,
    fontSize: 34,
    fontFamily: Fonts.extraBoldItalic,
    marginBottom: 6,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 20, 50, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(156, 39, 176, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  cardDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    lineHeight: 20,
  },
  bottomLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  bottomLinkText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
  },
  bottomLinkAction: {
    color: Colors.pink,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
});
