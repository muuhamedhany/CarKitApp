import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { addressService, bookingService, paymentService } from '@/services/api';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { PaymentMethod } from '@/services/api/payment.service';

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
  const { colors } = useTheme();
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

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const response = await addressService.getAddresses();
        if (response.success && Array.isArray(response.data)) {
          setAddresses(response.data);
          if (response.data.length > 0) {
            setSelectedAddressId(response.data[0].address_id);
          }
        }
      } catch {
        showToast('error', 'Address Error', 'Could not load addresses.');
      } finally {
        setLoadingAddresses(false);
      }
    };

    loadAddresses();
  }, [showToast, token]);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Book Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{serviceName}</Text>
          <Text style={[styles.summaryProvider, { color: colors.textSecondary }]}>Provider: {providerName}</Text>
          <Text style={[styles.summaryPrice, { color: colors.pink }]}>{price} EGP</Text>
          <Text style={[styles.summaryDuration, { color: colors.textSecondary }]}>Duration: {duration} min</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {dateChoices.map((date) => {
            const selected = selectedDate === date.value;
            return (
              <Pressable
                key={date.value}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: selected ? colors.pink : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedDate(date.value)}
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

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg }]}>Select Time</Text>
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
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: selected ? colors.pink : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[styles.timeSlotText, { color: selected ? colors.pink : colors.textPrimary }]}>
                    {formatTimeLabel(time)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="clock-alert-outline" size={20} color={colors.pink} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>No provider time slots available for this service.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Address</Text>
        {loadingAddresses ? (
          <ActivityIndicator size="small" color={colors.pink} />
        ) : addresses.length === 0 ? (
          <Pressable
            style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/profile/addresses')}
          >
            <MaterialCommunityIcons name="map-marker-plus-outline" size={20} color={colors.pink} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>No address found. Tap to add one.</Text>
          </Pressable>
        ) : (
          addresses.map((address) => {
            const active = selectedAddressId === address.address_id;
            return (
              <Pressable
                key={address.address_id}
                style={[
                  styles.addressCard,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: active ? colors.pink : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedAddressId(address.address_id)}
              >
                <View style={styles.addressHeader}>
                  <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>{address.title || 'Address'}</Text>
                  {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.pink} /> : null}
                </View>
                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                  {address.street || ''}{address.street && address.city ? ', ' : ''}{address.city || ''}
                </Text>
              </Pressable>
            );
          })
        )}

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Payment Method</Text>
        {paymentMethods.map((method) => {
          const active = paymentMethod === method.value;
          return (
            <Pressable
              key={method.value}
              style={[
                styles.methodCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: active ? colors.pink : colors.cardBorder,
                },
              ]}
              onPress={() => setPaymentMethod(method.value)}
            >
              <View style={styles.methodLeft}>
                <MaterialCommunityIcons
                  name={method.icon as any}
                  size={20}
                  color={active ? colors.pink : colors.textMuted}
                />
                <View style={styles.methodTextBlock}>
                  <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
                  <Text style={[styles.methodDescription, { color: colors.textSecondary }]}>{method.description}</Text>
                </View>
              </View>
              {active ? (
                <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} />
              ) : (
                <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textMuted} />
              )}
            </Pressable>
          );
        })}

        {paymentMethod === 'instapay' && (
          <View style={[styles.paymentDetailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentHeading, { color: colors.textPrimary }]}>InstaPay Reference</Text>
            <TextInput
              value={instapayReference}
              onChangeText={setInstapayReference}
              placeholder="Enter reference number"
              placeholderTextColor={colors.textMuted}
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.cardBorder }]}
            />
          </View>
        )}

        {paymentMethod === 'vodafone_cash' && (
          <View style={[styles.paymentDetailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentHeading, { color: colors.textPrimary }]}>Vodafone Cash Number</Text>
            <TextInput
              value={vodafoneNumber}
              onChangeText={setVodafoneNumber}
              placeholder="Enter wallet number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.cardBorder }]}
            />
          </View>
        )}

        {paymentMethod === 'credit_card' && (
          <View style={[styles.paymentDetailsCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.paymentHeading, { color: colors.textPrimary }]}>Card Details</Text>
            <TextInput
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="Card number"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={[styles.textInput, { color: colors.textPrimary, borderColor: colors.cardBorder }]}
            />
            <View style={styles.cardRow}>
              <TextInput
                value={cardExpiry}
                onChangeText={setCardExpiry}
                placeholder="MM/YY"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInput, styles.cardHalfInput, { color: colors.textPrimary, borderColor: colors.cardBorder }]}
              />
              <TextInput
                value={cardCvv}
                onChangeText={setCardCvv}
                placeholder="CVV"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                secureTextEntry
                style={[styles.textInput, styles.cardHalfInput, { color: colors.textPrimary, borderColor: colors.cardBorder }]}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: colors.background }]}>
        <View style={styles.totalBlock}>
          <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{price} EGP</Text>
        </View>
        <Pressable
          onPress={handlePlaceBooking}
          disabled={!canPlaceBooking}
          style={[styles.confirmButton, { backgroundColor: colors.pink, opacity: canPlaceBooking ? 1 : 0.45 }]}
        >
          {placingBooking ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirm Booking</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
  content: { paddingHorizontal: Spacing.md, paddingBottom: 140 },
  summaryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  summaryTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  summaryProvider: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 4 },
  summaryPrice: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg, marginTop: 4 },
  summaryDuration: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 4 },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
  dateRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  dateChip: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minWidth: 100,
  },
  dateChipLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginBottom: 2 },
  dateChipValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  timeSlot: {
    width: '22%',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  timeSlotText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  infoCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, flex: 1 },
  addressCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  addressTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  addressText: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
  methodCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  methodTextBlock: { flex: 1 },
  methodLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  methodDescription: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
  paymentDetailsCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  paymentHeading: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  cardRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cardHalfInput: { flex: 1 },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  totalBlock: { justifyContent: 'center' },
  totalLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },
  confirmButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
