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

interface TermSection {
  icon: string;
  title: string;
  content: string;
}

const TERMS_SECTIONS: TermSection[] = [
  {
    icon: 'handshake-outline',
    title: '1. Acceptance of Terms',
    content: 'Welcome to CarKit. By creating an account or using our mobile application, you agree to comply with and be bound by these Terms of Service. CarKit operates an automotive marketplace that connects vehicle owners ("Clients") with certified service providers ("Providers") and product vendors ("Vendors"). If you do not agree to these terms, please do not use our services.'
  },
  {
    icon: 'calendar-clock',
    title: '2. Bookings & Services',
    content: 'Clients can schedule vehicle maintenance, repair, tuning, and washing services directly through the app. A booking represents a binding contract between the Client and the designated Provider. Providers are responsible for the quality, safety, and legality of services rendered. Cancellations and refunds are governed by the respective Provider\'s cancellation policy, which is displayed at the time of booking.'
  },
  {
    icon: 'store-outline',
    title: '3. Product Orders & Deliveries',
    content: 'Clients may purchase automotive parts, accessories, and supplies listed by independent Vendors. Vendors are solely responsible for shipping times, product compliance, item descriptions, and fulfilling product returns in accordance with consumer protection guidelines. CarKit acts strictly as an escrow and transactional platform.'
  },
  {
    icon: 'alert-decagram-outline',
    title: '4. Emergency Roadside Assistance',
    content: 'CarKit provides on-demand emergency assistance (e.g., roadside battery jumpstarts, tire replacement, towing, fuel delivery). Clients requesting emergency dispatch represent that their vehicle location and condition are accurate. Any abuse of emergency dispatch systems, including false or malicious requests, will result in immediate permanent account termination and potential legal liabilities.'
  },
  {
    icon: 'credit-card-outline',
    title: '5. Payments, Fees & Billing',
    content: 'All marketplace payments are secured and processed through integrated gateways. Clients agree to pay all applicable service and product charges, taxes, and platform convenience fees. CarKit reserves the right to charge commissions or service fees to Vendors and Providers on platform transactions. Payouts are conducted according to the standard vendor billing cycles.'
  },
  {
    icon: 'shield-account-outline',
    title: '6. Limitation of Liability',
    content: 'CarKit facilitates connections but is not an automotive service provider or vendor. We are not liable for any direct, indirect, incidental, or consequential damages resulting from incomplete services, product malfunctions, roadside assistance delays, or personal injury sustained during service fulfillment. You agree to indemnify and hold CarKit harmless from any claims arising from marketplace interactions.'
  }
];

export default function TermsScreen() {
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
      <View style={[styles.orb, { top: -120, left: -120, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, right: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredHeader
          title="Terms of Service"
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerInfo}>
          <View style={[styles.iconWrap, { backgroundColor: colors.pink + '15' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={32} color={colors.pink} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Usage Guidelines</Text>
          <Text style={[styles.headerDesc, { color: colors.textMuted }]}>
            Please review these terms to understand your rights, responsibilities, and guidelines when using the CarKit platform.
          </Text>
        </Animated.View>

        <View style={styles.list}>
          {TERMS_SECTIONS.map((section, idx) => (
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
            title="I Understand"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
            style={styles.actionBtn}
            icon="check-circle-outline"
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
