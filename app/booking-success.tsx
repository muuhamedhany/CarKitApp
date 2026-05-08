import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, ZoomIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { GradientButton } from '@/components';

const { width, height } = Dimensions.get('window');

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const bookingId = params.bookingId || 'N/A';
  const serviceName = params.serviceName || 'Service';
  const providerName = params.providerName || 'Provider';
  const price = params.price || '0';

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
        colors={[isDark ? '#0F172A' : '#F8FAFC', isDark ? '#020617' : '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View entering={FadeInDown.duration(1000)} style={[styles.orb, styles.orb1, { backgroundColor: colors.pink }]} />
      <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={[styles.orb, styles.orb2, { backgroundColor: colors.purple }]} />

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
          <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.detailsCard}>
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
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <Text style={[styles.infoText, { color: colors.textMuted }]}>
            The service provider will review your booking and confirm the appointment. You can track progress in My Bookings.
          </Text>
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
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    opacity: 0.12,
  },
  orb1: { top: -width * 0.2, right: -width * 0.1 },
  orb2: { bottom: height * 0.1, left: -width * 0.3 },

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
