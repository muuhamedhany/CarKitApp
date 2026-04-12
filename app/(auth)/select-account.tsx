import { useTheme } from '@/hooks/useTheme';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

export default function SelectAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.pink }]}>Choose Account Type</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Select how you want to use CarKit</Text>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => router.push('/signup-customer')}
        >
          <View style={[styles.cardIcon, { backgroundColor: colors.purpleGlow }]}>
            <MaterialCommunityIcons name="account-outline" size={28} color={colors.purpleLight} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Customer</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Find trusted mechanics and quality parts.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </Pressable>

        <Pressable
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
          onPress={() => router.push('/signup-vendor')}
        >
          <View style={[styles.cardIcon, { backgroundColor: colors.purpleGlow }]}>
            <MaterialCommunityIcons name="store-outline" size={28} color={colors.purpleLight} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Vendor/Service Provider</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              Grow your business and connect with customers.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
        </Pressable>

        <View style={styles.bottomLink}>
          <Text style={[styles.bottomLinkText, { color: colors.textSecondary }]}>Already have an account?  </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={[styles.bottomLinkAction, { color: colors.pink }]}>Login</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.md },
  title: { fontSize: 30, fontFamily: Fonts.extraBoldItalic, marginBottom: 6 },
  subtitle: { fontSize: FontSizes.md, fontFamily: Fonts.regular, marginBottom: Spacing.xxl },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: FontSizes.lg, fontFamily: Fonts.bold, marginBottom: 4 },
  cardDescription: { fontSize: FontSizes.sm, fontFamily: Fonts.regular, lineHeight: 20 },
  bottomLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  bottomLinkText: { fontSize: FontSizes.md, fontFamily: Fonts.regular },
  bottomLinkAction: { fontSize: FontSizes.md, fontFamily: Fonts.bold },
});
