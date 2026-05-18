import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, GlassView, GradientButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

interface PrivacySection {
  icon: string;
  title: string;
  content: string;
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    icon: 'database-search-outline',
    title: '1. Information We Collect',
    content: 'CarKit collects essential information to power your automotive marketplace experience. This includes account details (name, email, phone number), vehicle profiles (make, model, year, license plates), secure shipping addresses, and precise real-time geolocation coordinates (necessary for roadside emergency dispatching and tracking booking arrivals).'
  },
  {
    icon: 'cog-transfer-outline',
    title: '2. How We Use Information',
    content: 'We use your information to facilitate service bookings, process transaction invoices, deliver parts and accessories, and dispatch immediate roadside assistance. Geolocation coordinates are captured dynamically to guide Service Providers to your broken-down vehicle and map delivery arrivals. We do not sell or trade your personal data.'
  },
  {
    icon: 'share-variant-outline',
    title: '3. Data Sharing & Third-Parties',
    content: 'Your vehicle profile and real-time geolocation are shared with responding Service Providers ONLY during an active scheduled booking or emergency request. Financial information is securely passed to certified payment processors (e.g., Stripe, Google Pay) using industry-standard TLS encryption protocols.'
  },
  {
    icon: 'shield-lock-outline',
    title: '4. Data Security & Encryption',
    content: 'We prioritize your data security. All server-client communications are encrypted using high-grade Secure Sockets Layer (SSL/TLS) technology. Data storage is secured in isolated cloud backends with rigid access policies. Vehicle location history is aggregated or pruned periodically to uphold strict user confidentiality.'
  },
  {
    icon: 'account-cog-outline',
    title: '5. Your Privacy Controls',
    content: 'You maintain absolute command over your data. Through account settings, you can edit your profile details, manage active vehicle lists, delete saved addresses, and toggle system permission settings. Disabling location tracking is fully supported, though this will disable emergency roadside dispatch capabilities.'
  },
  {
    icon: 'delete-empty-outline',
    title: '6. Data Deletion & Rights',
    content: 'You have the right to request a complete export of your personal platform records or permanently close your account. Upon account deletion, all personal profiles, saved vehicles, transaction histories, and active settings will be scrubbed from our active production systems, subject to legal auditing requirements.'
  }
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Atmospheric depth orbs */}
      <View style={[styles.orb, { top: -120, left: -120, backgroundColor: colors.purple + '15' }]} />
      <View style={[styles.orb, { bottom: 100, right: -150, backgroundColor: colors.pink + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredHeader
          title="Privacy Policy"
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerInfo}>
          <View style={[styles.iconWrap, { backgroundColor: colors.pink + '15' }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={32} color={colors.pink} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Data Protection</Text>
          <Text style={[styles.headerDesc, { color: colors.textMuted }]}>
            We are dedicated to maintaining the trust and safety of our community. Review how we protect your personal files and vehicle data.
          </Text>
        </Animated.View>

        <View style={styles.list}>
          {PRIVACY_SECTIONS.map((section, idx) => (
            <Animated.View 
              key={idx} 
              entering={FadeInDown.delay(150 + idx * 50).springify()}
            >
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrap, { backgroundColor: colors.pink + '12' }]}>
                    <MaterialCommunityIcons name={section.icon as any} size={20} color={colors.pink} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{section.title}</Text>
                </View>
                <Text style={[styles.cardContent, { color: colors.textSecondary }]}>
                  {section.content}
                </Text>
              </GlassView>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.footerSection}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Last updated: May 18, 2026
          </Text>
          <GradientButton
            title="I Consent"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            style={styles.actionBtn}
            icon="shield-lock-outline"
          />
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 40 },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  headerInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg + 2,
    marginBottom: 8,
  },
  headerDesc: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },

  list: {
    gap: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    flex: 1,
  },
  cardContent: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    opacity: 0.9,
  },

  footerSection: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    gap: Spacing.md,
  },
  footerText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    opacity: 0.6,
  },
  actionBtn: {
    width: '100%',
  }
});
