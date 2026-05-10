import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { CenteredHeader, GlassView, GradientButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { addressService, bookingService, paymentService } from '@/services/api';
import { PaymentMethod } from '@/services/api/payment.service';

const { width, height } = Dimensions.get('window');

type Address = {
  address_id: number;
  title?: string;
  street?: string;
  city?: string;
};

type BookingParams = {
  serviceId?: string | string[];
  serviceName?: string | string[];
  price?: string | string[];
  duration?: string | string[];
  providerId?: string | string[];
  providerName?: string | string[];
  availableTimes?: string | string[];
};

const asString = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || '';

const addDays = (baseDate: Date, days: number) => {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const formatDateValue = (date: Date) => date.toISOString().split('T')[0];

const formatReadableDate = (isoDate: string) => {
  try {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
};

const formatTimeLabel = (time: string) => {
  const [hours, minutes] = time.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const computeEndTime = (startTime: string, durationMinutes: number) => {
  const [hours, minutes] = startTime.split(':').map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return startTime;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + durationMinutes);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const parseAvailableTimes = (value: string | string[] | undefined) => {
  const raw = asString(value);
  if (!raw) return [] as string[];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return raw.split(',').map((item) => item.trim()).filter(Boolean);
  }
};

const paymentMethods: Array<{ label: string; value: PaymentMethod; icon: string; description: string }> = [
  { label: 'Cash on Delivery', value: 'cash_on_delivery', icon: 'cash', description: 'Pay the provider after the service.' },
  { label: 'InstaPay', value: 'instapay', icon: 'bank-transfer', description: 'Enter your InstaPay reference number.' },
  { label: 'Vodafone Cash', value: 'vodafone_cash', icon: 'wallet-outline', description: 'Enter the wallet number to confirm payment.' },
  { label: 'Credit Card', value: 'credit_card', icon: 'credit-card-outline', description: 'Card fields are required before booking.' },
];

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { token } = useAuth();
  const params = useLocalSearchParams<BookingParams>();

  const serviceId = Number(asString(params.serviceId));
  const serviceName = asString(params.serviceName) || 'Service';
  const price = Number(asString(params.price)) || 0;
  const duration = Number(asString(params.duration)) || 60;
  const providerId = Number(asString(params.providerId)) || undefined;
  const providerName = asString(params.providerName) || 'Provider';
  const availableTimes = useMemo(() => parseAvailableTimes(params.availableTimes), [params.availableTimes]);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateValue(addDays(new Date(), 1)));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingBooking, setPlacingBooking] = useState(false);
  const [instapayReference, setInstapayReference] = useState('');
  const [vodafoneNumber, setVodafoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const dateChoices = useMemo(
    () => Array.from({ length: 5 }, (_, index) => {
      const date = addDays(new Date(), index + 1);
      const value = formatDateValue(date);
      return { value, label: formatReadableDate(value) };
    }),
    []
  );

  const loadAddresses = useCallback(async () => {
    try {
      const response = await addressService.getAddresses();
      if (response.success && Array.isArray(response.data)) {
        // Normalize IDs
        const normalized = response.data.map(addr => ({
          ...addr,
          address_id: addr.address_id || addr.id
        }));
        setAddresses(normalized);
        if (normalized.length > 0 && !selectedAddressId) {
          setSelectedAddressId(normalized[0].address_id);
        }
      }
    } catch {
      showToast('error', 'Address Error', 'Could not load addresses.');
    } finally {
      setLoadingAddresses(false);
    }
  }, [selectedAddressId, showToast]);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  const selectedAddress = addresses.find((address) => address.address_id === selectedAddressId) || null;
  const selectedAddressLabel = selectedAddress
    ? [selectedAddress.title, selectedAddress.street, selectedAddress.city].filter(Boolean).join(' • ')
    : '';

  const paymentDetailsValid = useMemo(() => {
    if (paymentMethod === 'cash_on_delivery') return true;
    if (paymentMethod === 'instapay') return instapayReference.trim().length >= 4;
    if (paymentMethod === 'vodafone_cash') return vodafoneNumber.trim().length >= 8;
    return cardNumber.trim().length >= 8 && cardExpiry.trim().length >= 4 && cardCvv.trim().length >= 3;
  }, [cardCvv, cardExpiry, cardNumber, instapayReference, paymentMethod, vodafoneNumber]);

  const canPlaceBooking = Boolean(selectedAddressId) && Boolean(selectedTime) && paymentDetailsValid && !placingBooking;

  const handlePlaceBooking = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!selectedAddressId) {
      showToast('warning', 'Address Required', 'Please select a booking address.');
      return;
    }

    if (!selectedTime) {
      showToast('warning', 'Time Required', 'Please select an available provider time.');
      return;
    }

    if (!paymentDetailsValid) {
      showToast('warning', 'Payment Details Required', 'Please complete the payment fields for the selected method.');
      return;
    }

    try {
      setPlacingBooking(true);

      const bookingResponse = await bookingService.createBooking({
        service_id: serviceId,
        provider_id: providerId,
        booking_date: selectedDate,
        start_time: selectedTime,
        end_time: computeEndTime(selectedTime, duration),
        location: selectedAddressLabel || undefined,
        booking_price: price,
        address_id: selectedAddressId,
        payment_method: paymentMethod,
      });

      if (!bookingResponse.success || !bookingResponse.data?.booking_id) {
        showToast('error', 'Booking Failed', bookingResponse.message || 'Could not create booking.');
        return;
      }

      await paymentService.createPayment({
        booking_id: bookingResponse.data.booking_id,
        method: paymentMethod,
        amount: price,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: '/booking-success' as any,
        params: {
          bookingId: String(bookingResponse.data.booking_id),
          serviceName,
          providerName,
          price: String(price),
        },
      });
    } catch {
      showToast('error', 'Booking Error', 'Something went wrong.');
    } finally {
      setPlacingBooking(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[isDark ? '#0F172A' : '#F8FAFC', isDark ? '#020617' : '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeInDown.duration(1000)} style={[styles.orb, styles.orb1, { backgroundColor: colors.pink }]} />
      <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={[styles.orb, styles.orb2, { backgroundColor: colors.purple }]} />

      <CenteredHeader
        title="Confirm Booking"
        titleColor={colors.textPrimary}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.summaryCard} {...{} as any}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryInfo}>
                <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{serviceName}</Text>
                <Text style={[styles.summaryProvider, { color: colors.textSecondary }]}>by {providerName}</Text>
              </View>
              <Text style={[styles.summaryPrice, { color: colors.pink }]}>{price} EGP</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryFooter}>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>{duration} min</Text>
              </View>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.textSecondary} />
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>Certified</Text>
              </View>
            </View>
          </GlassView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateChoices.map((date) => {
              const selected = selectedDate === date.value;
              return (
                <Pressable
                  key={date.value}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: selected ? colors.pink + '20' : 'rgba(255,255,255,0.05)',
                      borderColor: selected ? colors.pink : 'rgba(255,255,255,0.1)',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDate(date.value);
                  }}
                >
                  <Text style={[styles.dateChipLabel, { color: selected ? colors.pink : colors.textSecondary }]}>
                    {date.label.split(' ')[0]}
                  </Text>
                  <Text style={[styles.dateChipValue, { color: colors.textPrimary }]}>
                    {date.label.split(' ').slice(1).join(' ')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Select Time</Text>
          {availableTimes.length > 0 ? (
            <View style={styles.timeGrid}>
              {availableTimes.map((time) => {
                const selected = selectedTime === time;
                return (
                  <Pressable
                    key={time}
                    style={[
                      styles.timeSlot,
                      {
                        backgroundColor: selected ? colors.pink + '20' : 'rgba(255,255,255,0.05)',
                        borderColor: selected ? colors.pink : 'rgba(255,255,255,0.1)',
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedTime(time);
                    }}
                  >
                    <Text style={[styles.timeSlotText, { color: selected ? colors.pink : colors.textPrimary }]}>
                      {formatTimeLabel(time)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
              <MaterialCommunityIcons name="clock-alert-outline" size={20} color={colors.pink} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>No provider time slots available for this service.</Text>
            </GlassView>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Address</Text>
          {loadingAddresses ? (
            <ActivityIndicator size="small" color={colors.pink} />
          ) : addresses.length === 0 ? (
            <Pressable
              onPress={() => router.push('/profile/addresses')}
            >
              <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
                <MaterialCommunityIcons name="map-marker-plus-outline" size={20} color={colors.pink} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>No address found. Tap to add one.</Text>
              </GlassView>
            </Pressable>
          ) : (
            addresses.map((address) => {
              const active = selectedAddressId === address.address_id;
              return (
                <Pressable
                  key={address.address_id}
                  style={styles.addressWrapper}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAddressId(address.address_id);
                  }}
                >
                  <GlassView
                    intensity={active ? 40 : 20}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.addressCard, { borderColor: active ? colors.pink : 'rgba(255,255,255,0.1)' }]}
                  >
                    <View style={styles.addressHeader}>
                      <View style={styles.addressInfo}>
                        <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>{address.title || 'Address'}</Text>
                        <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                          {address.street || ''}{address.street && address.city ? ', ' : ''}{address.city || ''}
                        </Text>
                      </View>
                      <View style={[styles.radioCircle, { borderColor: active ? colors.pink : colors.textMuted }]}>
                        {active && <View style={[styles.radioInner, { backgroundColor: colors.pink }]} />}
                      </View>
                    </View>
                  </GlassView>
                </Pressable>
              );
            })
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Payment Method</Text>
          {paymentMethods.map((method) => {
            const active = paymentMethod === method.value;
            return (
              <Pressable
                key={method.value}
                style={styles.methodWrapper}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPaymentMethod(method.value);
                }}
              >
                <GlassView
                  intensity={active ? 40 : 20}
                  tint={isDark ? 'dark' : 'light'}
                  style={[styles.methodCard, { borderColor: active ? colors.pink : 'rgba(255,255,255,0.1)' }]}
                >
                  <View style={[styles.methodIcon, { backgroundColor: active ? colors.pink + '20' : 'rgba(255,255,255,0.05)' }]}>
                    <MaterialCommunityIcons
                      name={method.icon as any}
                      size={24}
                      color={active ? colors.pink : colors.textMuted}
                    />
                  </View>
                  <View style={styles.methodTextBlock}>
                    <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
                    <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>{method.description}</Text>
                  </View>
                  <View style={[styles.radioCircle, { borderColor: active ? colors.pink : colors.textMuted }]}>
                    {active && <View style={[styles.radioInner, { backgroundColor: colors.pink }]} />}
                  </View>
                </GlassView>
              </Pressable>
            );
          })}

          {paymentMethod === 'instapay' && (
            <GlassView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.paymentDetailsCard} {...{} as any}>
              <Text style={[styles.paymentHeading, { color: colors.textPrimary }]}>InstaPay Reference</Text>
              <TextInput
                value={instapayReference}
                onChangeText={setInstapayReference}
                placeholder="Enter reference number"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, { color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
              />
            </GlassView>
          )}

          {paymentMethod === 'vodafone_cash' && (
            <GlassView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.paymentDetailsCard}>
              <Text style={[styles.paymentHeading, { color: colors.textPrimary }]}>Vodafone Cash Number</Text>
              <TextInput
                value={vodafoneNumber}
                onChangeText={setVodafoneNumber}
                placeholder="Enter wallet number"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={[styles.textInput, { color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
              />
            </GlassView>
          )}

          {paymentMethod === 'credit_card' && (
            <GlassView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.paymentDetailsCard}>
              <Text style={[styles.paymentHeading, { color: colors.textPrimary }]}>Card Details</Text>
              <TextInput
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="Card number"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={[styles.textInput, { color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
              />
              <View style={styles.cardRow}>
                <TextInput
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.textInput, styles.cardHalfInput, { color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
                />
                <TextInput
                  value={cardCvv}
                  onChangeText={setCardCvv}
                  placeholder="CVV"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  secureTextEntry
                  style={[styles.textInput, styles.cardHalfInput, { color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
                />
              </View>
            </GlassView>
          )}
        </Animated.View>

        <View style={{ height: 160 }} />
      </ScrollView>

      <GlassView intensity={Platform.OS === 'ios' ? 80 : 100} tint={isDark ? 'dark' : 'light'} style={styles.bottomBar} {...{} as any}>
        <View style={styles.totalContainer}>
          <View style={styles.totalInfo}>
            <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total Price</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{price} EGP</Text>
          </View>
          <GradientButton
            title={placingBooking ? "Booking..." : "Confirm Booking"}
            onPress={handlePlaceBooking}
            loading={placingBooking}
            disabled={!canPlaceBooking}
            style={styles.confirmButton}
            icon="check-circle-outline"
          />
        </View>
      </GlassView>
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
  orb2: { bottom: height * 0.2, left: -width * 0.3 },

  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  summaryCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryInfo: { flex: 1 },
  summaryTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
  summaryProvider: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4, opacity: 0.7 },
  summaryPrice: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl },
  divider: { height: 1, marginVertical: Spacing.lg, opacity: 0.1 },
  summaryFooter: { flexDirection: 'row', gap: Spacing.xl },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.8 },

  sectionTitle: { fontSize: 11, fontFamily: Fonts.bold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md, marginLeft: 4, opacity: 0.6, marginTop: Spacing.xl },
  dateRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  dateChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minWidth: 100,
    alignItems: 'center',
  },
  dateChipLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  dateChipValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeSlot: {
    width: (width - Spacing.md * 2 - Spacing.sm * 3) / 4,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  timeSlotText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  infoCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  infoText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, flex: 1 },

  addressWrapper: { marginBottom: Spacing.sm },
  addressCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressInfo: { flex: 1 },
  addressTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2 },
  addressText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.7 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  methodWrapper: { marginBottom: Spacing.sm },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  methodIcon: { width: 48, height: 48, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  methodTextBlock: { flex: 1 },
  methodLabel: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  methodDescription: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2, opacity: 0.6 },

  paymentDetailsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    gap: Spacing.md,
  },
  paymentHeading: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, opacity: 0.8 },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 54,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
  },
  cardRow: { flexDirection: 'row', gap: Spacing.sm },
  cardHalfInput: { flex: 1 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  totalContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  totalInfo: { flex: 0.8 },
  totalLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', opacity: 0.6, marginBottom: 2 },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: 24 },
  confirmButton: { flex: 1.2 },
});
