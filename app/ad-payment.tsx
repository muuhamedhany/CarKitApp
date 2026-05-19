import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { adService } from '@/services/api/ad.service';
import { apiFetch } from '@/services/api/client';
import { PaymentMethod } from '@/services/api/payment.service';
import { CenteredHeader, FormInput, GlassView } from '@/components';
import { Spacing, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const PAYMENT_METHODS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Cash on Delivery', value: 'cash_on_delivery', icon: 'cash' },
  { label: 'Credit Card', value: 'credit_card', icon: 'credit-card-outline' },
];

export default function AdPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const params = useLocalSearchParams<{
    banner_image_url: string;
    title: string;
    duration_days: string;
    price: string;
  }>();

  const bannerUrl = params.banner_image_url || '';
  const title = params.title || '';
  const durationDays = Number(params.duration_days) as 7 | 14 | 30;
  const price = Number(params.price);

  const durationLabel =
    durationDays === 7  ? '7 Days'  :
    durationDays === 14 ? '14 Days' : '30 Days';

  const [method, setMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cardDigits = useMemo(() => cardNumber.replace(/\s/g, ''), [cardNumber]);

  const isValidExpiry = (v: string) => {
    const m = v.match(/^(\d{2})\/(\d{2})$/);
    if (!m) return false;
    return Number(m[1]) >= 1 && Number(m[1]) <= 12;
  };

  const canPay = useMemo(() => {
    if (method === 'cash_on_delivery') return true;
    if (method === 'credit_card') {
      return (
        cardHolderName.trim().length > 2 &&
        cardDigits.length >= 13 &&
        isValidExpiry(cardExpiry.trim()) &&
        /^\d{3,4}$/.test(cardCvv.trim())
      );
    }
    return false;
  }, [method, cardHolderName, cardDigits, cardExpiry, cardCvv]);

  const handleConfirmPayment = async () => {
    if (!canPay) {
      if (method === 'credit_card') {
        showToast('warning', 'Card Details Required', 'Please complete all card fields.');
      }
      return;
    }

    try {
      setSubmitting(true);
      const adRes = await adService.createAd({
        banner_image_url: bannerUrl || null,
        title: title || undefined,
        duration_days: durationDays,
        price,
      });

      if (!adRes.success || !adRes.data) {
        showToast('error', 'Ad Creation Failed', adRes.message || 'Could not create the ad.');
        return;
      }

      try {
        await apiFetch('/payments', {
          method: 'POST',
          body: JSON.stringify({
            method,
            amount: price,
            ad_id: adRes.data.ad_id,
          }),
        });
      } catch {
        // Payment record failure is non-blocking
      }

      router.replace({
        pathname: '/ad-success' as any,
        params: { ad_id: String(adRes.data.ad_id) },
      });
    } catch {
      showToast('error', 'Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]} showsVerticalScrollIndicator={false}>
        <CenteredHeader title="Checkout" titleColor={colors.textPrimary} />

        <Animated.View entering={FadeInDown.delay(100)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.summaryCard, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Details</Text>
            {title ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Ad Title</Text>
                <Text style={[styles.summaryVal, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
              </View>
            ) : null}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: colors.textSecondary }]}>Duration</Text>
              <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{durationLabel}</Text>
            </View>
            {bannerUrl ? (
              <View style={[styles.bannerContainer, { borderColor: colors.cardBorder }]}>
                <Image source={{ uri: bannerUrl }} style={styles.bannerPreview} resizeMode="cover" />
              </View>
            ) : null}
            <View style={[styles.totalRow, { borderTopColor: colors.cardBorder }]}>
              <Text style={[styles.totalKey, { color: colors.textPrimary }]}>Total Amount</Text>
              <Text style={[styles.totalVal, { color: colors.pink }]}>{price.toLocaleString('en-EG')} EGP</Text>
            </View>
          </GlassView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Payment Method</Text>
        </Animated.View>
        <View style={styles.methodList}>
          {PAYMENT_METHODS.map((pm, idx) => {
            const active = method === pm.value;
            return (
              <Animated.View key={pm.value} entering={FadeInDown.delay(300 + idx * 100)}>
                <Pressable
                  style={[styles.methodCard, {
                    borderColor: active ? colors.pink : colors.cardBorder,
                    borderWidth: active ? 2 : 1,
                    backgroundColor: active ? colors.pink + '08' : 'transparent'
                  }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMethod(pm.value); }}
                >
                  <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={styles.methodInner}>
                    <View style={styles.methodLeft}>
                      <View style={[styles.methodIcon, { backgroundColor: active ? colors.pink + '15' : colors.cardBorder }]}>
                        <MaterialCommunityIcons
                          name={pm.icon as any}
                          size={22}
                          color={active ? colors.pink : colors.textSecondary}
                        />
                      </View>
                      <Text style={[styles.methodLabel, { color: active ? colors.textPrimary : colors.textSecondary, fontFamily: active ? Fonts.bold : Fonts.medium }]}>{pm.label}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={active ? 'check-circle' : 'circle-outline'}
                      size={24}
                      color={active ? colors.pink : colors.cardBorder}
                    />
                  </GlassView>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInUp.delay(600)}>
          {method === 'credit_card' && (
            <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.detailsCard, { borderColor: colors.cardBorder }]}>
              <Text style={[styles.detailsTitle, { color: colors.textPrimary, marginBottom: Spacing.md }]}>Card Information</Text>
              <FormInput
                label="Card Holder"
                value={cardHolderName}
                onChangeText={setCardHolderName}
                placeholder="Full Name"
                icon="account-outline"
              />
              <FormInput
                label="Card Number"
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="0000 0000 0000 0000"
                keyboardType="number-pad"
                icon="credit-card-outline"
              />
              <View style={styles.rowInputs}>
                <View style={{ flex: 1.5 }}>
                  <FormInput
                    label="Expiry Date"
                    value={cardExpiry}
                    onChangeText={setCardExpiry}
                    placeholder="MM/YY"
                    icon="calendar-range"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="CVV"
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    placeholder="000"
                    keyboardType="number-pad"
                    secureTextEntry
                    icon="lock-outline"
                  />
                </View>
              </View>
            </GlassView>
          )}
        </Animated.View>
        <View style={{ height: 160 }} />
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(800)} style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(5, 5, 5, 0.8)' : 'rgba(255,255,255,0.8)' }]}>
        <GlassView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.buttonBlur}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); handleConfirmPayment(); }}
            disabled={!canPay || submitting}
            style={[
              styles.payBtn,
              { backgroundColor: colors.pink, opacity: (!canPay || submitting) ? 0.5 : 1 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payBtnText}>
                {method === 'cash_on_delivery' ? 'Confirm' : 'Pay'} {price.toLocaleString('en-EG')} EGP
              </Text>
            )}
          </Pressable>
        </GlassView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  summaryCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  summaryTitle: { fontFamily: Fonts.extraBold, fontSize: 20, marginBottom: Spacing.lg, letterSpacing: -0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryKey: { fontFamily: Fonts.medium, fontSize: 15 },
  summaryVal: { fontFamily: Fonts.bold, fontSize: 15, textAlign: 'right' },
  bannerContainer: {
    width: '100%',
    aspectRatio: 3,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bannerPreview: { width: '100%', height: '100%' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  totalKey: { fontFamily: Fonts.extraBold, fontSize: 18 },
  totalVal: { fontFamily: Fonts.extraBold, fontSize: 24 },

  sectionTitle: { fontFamily: Fonts.extraBold, fontSize: 20, marginBottom: Spacing.md, letterSpacing: -0.5 },
  methodList: { gap: Spacing.sm, marginBottom: Spacing.xl },
  methodCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  methodInner: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  methodIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 16 },

  detailsCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  detailsTitle: { fontFamily: Fonts.bold, fontSize: 18, marginBottom: Spacing.sm },
  detailsText: { fontFamily: Fonts.medium, fontSize: 14, marginBottom: Spacing.md, lineHeight: 22 },
  accountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  accountValue: { fontFamily: Fonts.extraBold, fontSize: 18, letterSpacing: 0.5 },
  uploadBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.xl,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadBtnText: { fontFamily: Fonts.semiBold, fontSize: 14 },
  proofWrap: { marginTop: Spacing.md, position: 'relative', width: 120, height: 120 },
  proofImage: { width: '100%', height: '100%', borderRadius: BorderRadius.lg },
  removeProof: { position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12 },
  proofDone: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  rowInputs: { flexDirection: 'row', gap: Spacing.md },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, overflow: 'hidden' },
  buttonBlur: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
  payBtn: { borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', height: 56, ...Shadows.md },
  payBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: 16 },
});
