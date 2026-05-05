import { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { adService } from '@/services/api/ad.service';
import { apiFetch } from '@/services/api/client';
import { CenteredHeader } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type PaymentMethod = 'instapay' | 'vodafone_cash' | 'credit_card';

const PAYMENT_METHODS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'InstaPay',       value: 'instapay',      icon: 'bank-transfer' },
  { label: 'Vodafone Cash',  value: 'vodafone_cash', icon: 'wallet-outline' },
  { label: 'Credit Card',    value: 'credit_card',   icon: 'credit-card-outline' },
];

const INSTAPAY_USERNAME = 'carkit.pay';
const VODAFONE_CASH_NUMBER = '01004899835';

export default function AdPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const params = useLocalSearchParams<{
    banner_image_url: string;
    title: string;
    duration_days: string;
    price: string;
    target_product_ids: string;
    target_service_ids: string;
    target_category_ids: string;
  }>();

  const bannerUrl = params.banner_image_url || '';
  const title = params.title || '';
  const durationDays = Number(params.duration_days) as 7 | 14 | 30;
  const price = Number(params.price);

  // Parse target arrays from JSON strings
  const targetProductIds: number[] = (() => { try { return JSON.parse(params.target_product_ids || '[]'); } catch { return []; } })();
  const targetServiceIds: number[] = (() => { try { return JSON.parse(params.target_service_ids || '[]'); } catch { return []; } })();
  const targetCategoryIds: number[] = (() => { try { return JSON.parse(params.target_category_ids || '[]'); } catch { return []; } })();

  const durationLabel =
    durationDays === 7  ? '7 Days'  :
    durationDays === 14 ? '14 Days' : '30 Days';

  const [method, setMethod] = useState<PaymentMethod>('instapay');
  const [transferProofUri, setTransferProofUri] = useState<string | null>(null);
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
    if (method === 'instapay' || method === 'vodafone_cash') return Boolean(transferProofUri);
    if (method === 'credit_card') {
      return (
        cardHolderName.trim().length > 2 &&
        cardDigits.length >= 13 &&
        isValidExpiry(cardExpiry.trim()) &&
        /^\d{3,4}$/.test(cardCvv.trim())
      );
    }
    return false;
  }, [method, transferProofUri, cardHolderName, cardDigits, cardExpiry, cardCvv]);

  const pickTransferProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setTransferProofUri(result.assets[0].uri);
    }
  };

  const handleConfirmPayment = async () => {
    if (!canPay) {
      if (method !== 'credit_card') {
        showToast('warning', 'Proof Required', 'Please upload your payment transfer screenshot.');
      } else {
        showToast('warning', 'Card Details Required', 'Please complete all card fields.');
      }
      return;
    }

    try {
      setSubmitting(true);

      // 1. Create the ad in the DB (status = 'pending')
      const adRes = await adService.createAd({
        banner_image_url: bannerUrl || null,
        title: title || undefined,
        duration_days: durationDays,
        price,
        target_product_ids: targetProductIds,
        target_service_ids: targetServiceIds,
        target_category_ids: targetCategoryIds,
      });

      if (!adRes.success || !adRes.data) {
        showToast('error', 'Ad Creation Failed', adRes.message || 'Could not create the ad.');
        return;
      }

      // 2. Record the payment
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
        // Payment record failure is non-blocking (ad is already created)
      }

      // 3. Success!
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <CenteredHeader title="Ad Payment" titleColor={colors.textPrimary} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Order Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Ad Summary</Text>
          {title ? (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Title</Text>
              <Text style={[styles.summaryVal, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Duration</Text>
            <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{durationLabel}</Text>
          </View>
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={styles.bannerPreview} resizeMode="cover" />
          ) : null}
          <View style={[styles.totalRow, { borderTopColor: colors.cardBorder }]}>
            <Text style={[styles.totalKey, { color: colors.textMuted }]}>Total Due</Text>
            <Text style={[styles.totalVal, { color: colors.pink }]}>{price.toLocaleString('en-EG')} EGP</Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Payment Method</Text>
        {PAYMENT_METHODS.map((pm) => {
          const active = method === pm.value;
          return (
            <Pressable
              key={pm.value}
              style={[styles.methodCard, {
                backgroundColor: colors.backgroundSecondary,
                borderColor: active ? colors.pink : colors.cardBorder,
              }]}
              onPress={() => setMethod(pm.value)}
            >
              <View style={styles.methodLeft}>
                <MaterialCommunityIcons
                  name={pm.icon as any}
                  size={20}
                  color={active ? colors.pink : colors.textMuted}
                />
                <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{pm.label}</Text>
              </View>
              <MaterialCommunityIcons
                name={active ? 'radiobox-marked' : 'radiobox-blank'}
                size={18}
                color={active ? colors.pink : colors.textMuted}
              />
            </Pressable>
          );
        })}

        {/* Transfer proof — for InstaPay / Vodafone Cash */}
        {(method === 'instapay' || method === 'vodafone_cash') && (
          <View style={[styles.detailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>Transfer Details</Text>
            <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
              Send {price.toLocaleString('en-EG')} EGP to:{' '}
              <Text style={{ color: colors.pink }}>
                {method === 'instapay' ? INSTAPAY_USERNAME : VODAFONE_CASH_NUMBER}
              </Text>
            </Text>
            <Pressable
              style={[styles.uploadBtn, { borderColor: colors.pink }]}
              onPress={pickTransferProof}
            >
              <MaterialCommunityIcons name="image-plus" size={18} color={colors.pink} />
              <Text style={[styles.uploadBtnText, { color: colors.pink }]}>Upload payment screenshot</Text>
            </Pressable>
            {transferProofUri ? (
              <View style={styles.proofWrap}>
                <Image source={{ uri: transferProofUri }} style={styles.proofImage} />
                <Text style={[styles.proofDone, { color: colors.textSecondary }]}>
                  ✓ Screenshot uploaded
                </Text>
              </View>
            ) : (
              <Text style={[styles.hint, { color: colors.textMuted }]}>Required to confirm payment.</Text>
            )}
          </View>
        )}

        {/* Credit Card fields */}
        {method === 'credit_card' && (
          <View style={[styles.detailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>Card Details</Text>
            {[
              { label: 'Card holder name', value: cardHolderName, set: setCardHolderName, kbType: 'default' as const, secure: false },
              { label: 'Card number', value: cardNumber, set: setCardNumber, kbType: 'number-pad' as const, secure: false },
            ].map((field) => (
              <TextInput
                key={field.label}
                value={field.value}
                onChangeText={field.set}
                placeholder={field.label}
                placeholderTextColor={colors.textMuted}
                keyboardType={field.kbType}
                style={[styles.input, {
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.background,
                }]}
              />
            ))}
            <View style={styles.rowInputs}>
              <TextInput
                value={cardExpiry}
                onChangeText={setCardExpiry}
                placeholder="MM/YY"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.halfInput, {
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.background,
                }]}
              />
              <TextInput
                value={cardCvv}
                onChangeText={setCardCvv}
                placeholder="CVV"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.input, styles.halfInput, {
                  color: colors.textPrimary,
                  borderColor: colors.cardBorder,
                  backgroundColor: colors.background,
                }]}
              />
            </View>
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Complete all fields to confirm.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: colors.background }]}>
        <Pressable
          onPress={handleConfirmPayment}
          disabled={!canPay || submitting}
          style={[
            styles.payBtn,
            { backgroundColor: colors.pink, opacity: (!canPay || submitting) ? 0.45 : 1 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>Confirm Payment — {price.toLocaleString('en-EG')} EGP</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  summaryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryKey: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  summaryVal: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, maxWidth: '60%', textAlign: 'right' },
  bannerPreview: {
    width: '100%', height: 100,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginTop: Spacing.xs,
  },
  totalKey: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
  totalVal: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },

  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  methodCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  methodLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },

  detailsCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  detailsTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: Spacing.xs },
  detailsText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: Spacing.sm, lineHeight: 20 },
  uploadBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  uploadBtnText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  proofWrap: { marginTop: Spacing.sm, alignItems: 'flex-start' },
  proofImage: { width: 100, height: 100, borderRadius: BorderRadius.sm, marginBottom: 4 },
  proofDone: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  hint: { marginTop: Spacing.xs, fontFamily: Fonts.regular, fontSize: FontSizes.xs },

  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  rowInputs: { flexDirection: 'row', gap: Spacing.sm },
  halfInput: { flex: 1 },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  payBtn: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  payBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
