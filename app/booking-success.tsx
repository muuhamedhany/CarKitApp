import { GlassView, GradientButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const asParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const bookingId = asParam(params.bookingId) || 'N/A';
  const serviceName = asParam(params.serviceName) || 'Service';
  const providerName = asParam(params.providerName) || 'Provider';
  const price = asParam(params.price) || '0';
  const queueNumber = asParam(params.queueNumber) ? Number(asParam(params.queueNumber)) : null;
  const peopleBefore = asParam(params.peopleBefore) ? Number(asParam(params.peopleBefore)) : 0;
  const waitMinutes = asParam(params.waitMinutes) ? Number(asParam(params.waitMinutes)) : 0;

  const formatQueueTime = (value?: string | string[]) => {
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return '-';
    try {
      return new Date(raw).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return raw;
    }
  };

  const scale = useSharedValue(0.5);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    scale.value = withSpring(1, { damping: 10, stiffness: 100 });
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
        <Animated.View style={[styles.iconCircle, animatedIconStyle, { backgroundColor: colors.pinkGlow || colors.pink + '20' }]}>
          <MaterialCommunityIcons name="check" size={54} color={colors.pink} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Booking Confirmed!</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your service has been successfully booked
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.cardWrapper}>
          <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.detailsCard}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Booking Summary</Text>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Service</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{serviceName}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Provider</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{providerName}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Booking ID</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>#{bookingId}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Amount Paid</Text>
              <Text style={[styles.detailValue, { color: colors.pink, fontFamily: Fonts.extraBold }]}>{price} EGP</Text>
            </View>

            {queueNumber ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Queue Number</Text>
                  <Text style={[styles.detailValue, { color: colors.pink, fontFamily: Fonts.extraBold }]}>#{queueNumber}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Show Up</Text>
                  <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatQueueTime(params.showUpAt)}</Text>
                </View>
                <Text style={[styles.queueHint, { color: colors.textSecondary }]}>
                  {peopleBefore} before you | about {waitMinutes} min wait.
                </Text>
              </>
            ) : null}
          </GlassView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.buttonContainer}>
          <GradientButton
            title="View My Bookings"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace('/my-bookings');
            }}
            icon="calendar-check"
          />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/(tabs)');
            }}
            style={styles.homeBtn}
          >
            <Text style={[styles.homeBtnText, { color: colors.textSecondary }]}>Back to Home</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  content: { flex: 1, paddingHorizontal: Spacing.xl, alignItems: 'center' },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xxl, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.md, textAlign: 'center', marginTop: 8, opacity: 0.7 },

  cardWrapper: { width: '100%', marginTop: Spacing.xxl },
  detailsCard: {
    width: '100%', borderRadius: BorderRadius.xxl,
    padding: Spacing.xl, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.lg, opacity: 0.8 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  divider: { height: 1, opacity: 0.05 },
  detailLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.6 },
  detailValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  queueHint: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: Spacing.md, lineHeight: 18 },

  infoText: {
    fontFamily: Fonts.medium, fontSize: FontSizes.sm,
    textAlign: 'center', marginTop: Spacing.xl,
    lineHeight: 22, opacity: 0.6,
    paddingHorizontal: Spacing.md
  },

  buttonContainer: { width: '100%', marginTop: Spacing.xxl, gap: Spacing.md },
  homeBtn: { alignItems: 'center', paddingVertical: 12 },
  homeBtnText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, opacity: 0.8 },
});
