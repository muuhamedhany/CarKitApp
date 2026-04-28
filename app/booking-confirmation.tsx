import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { addressService, bookingService, paymentService } from '@/services/api';
import { API_URL } from '@/constants/config';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

type Address = {
  address_id: number;
  title?: string;
  street?: string;
  city?: string;
};

const paymentMethods: { label: string; value: string; icon: string }[] = [
  { label: 'Cash on Delivery', value: 'cash_on_delivery', icon: 'cash' },
  { label: 'InstaPay', value: 'instapay', icon: 'bank-transfer' },
  { label: 'Vodafone Cash', value: 'vodafone_cash', icon: 'wallet-outline' },
  { label: 'Credit Card', value: 'credit_card', icon: 'credit-card-outline' },
];

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

// Time slots for booking
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00',
  '17:00', '18:00', '19:00', '20:00',
];

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { token } = useAuth();
  const params = useLocalSearchParams();

  const serviceId = Number(params.serviceId);
  const serviceName = params.serviceName || 'Service';
  const price = Number(params.price) || 0;
  const duration = Number(params.duration) || 60;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash_on_delivery');
  const [selectedDate, setSelectedDate] = useState<string>(formatDateValue(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingBooking, setPlacingBooking] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Generate next 7 days for date selection
  const today = useMemo(() => new Date(), []);
  const dateChoices = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i);
      return { value: formatDateValue(d), label: formatReadableDate(formatDateValue(d)) };
    }),
    [today]
  );

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await addressService.getAddresses();
        if (res.success && Array.isArray(res.data)) {
          setAddresses(res.data);
          if (res.data.length > 0) {
            setSelectedAddressId(res.data[0].address_id);
          }
        }
      } catch {
        showToast('error', 'Address Error', 'Could not load addresses.');
      } finally {
        setLoadingAddresses(false);
      }
    };

    const loadVehicles = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/vehicles/my`, { headers });
        const data = await res.json();
        if (data.success) {
          setVehicles(data.data || []);
        }
      } catch {
        // silently fail
      }
    };

    loadAddresses();
    loadVehicles();
  }, [showToast, token]);

  const canPlaceBooking = useMemo(() => {
    return Boolean(selectedAddressId) && Boolean(selectedTime) && !placingBooking;
  }, [selectedAddressId, selectedTime, placingBooking]);

  const handlePlaceBooking = async () => {
    if (!canPlaceBooking) {
      if (!selectedAddressId) {
        showToast('warning', 'Address Required', 'Please select a shipping address.');
      } else if (!selectedTime) {
        showToast('warning', 'Time Required', 'Please select a time slot.');
      }
      return;
    }

    try {
      setPlacingBooking(true);

      const bookingRes = await bookingService.createBooking({
        service_id: serviceId,
        booking_date: selectedDate,
        start_time: selectedTime!,
        booking_price: price,
        address_id: selectedAddressId || undefined,
        vehicle_id: selectedVehicleId || undefined,
      });

      if (!bookingRes.success) {
        showToast('error', 'Booking Failed', bookingRes.message || 'Could not create booking.');
        return;
      }

      // Create payment record
      if (paymentMethod) {
        await paymentService.createPayment({
          booking_id: bookingRes.data?.booking_id,
          method: paymentMethod as any,
          amount: price,
        });
      }

      router.replace({
        pathname: '/booking-success' as any,
        params: {
          bookingId: String(bookingRes.data?.booking_id),
          serviceName,
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Book Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Service Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>{serviceName}</Text>
          <Text style={[styles.summaryPrice, { color: colors.pink }]}>{price} EGP</Text>
          <Text style={[styles.summaryDuration, { color: colors.textSecondary }]}>Duration: {duration} min</Text>
        </View>

        {/* Date Selection */}
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

        {/* Time Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg }]}>Select Time</Text>
        <View style={styles.timeGrid}>
          {TIME_SLOTS.map((time) => {
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
                  {time}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Address Selection */}
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
                  <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                    {address.title || 'Address'}
                  </Text>
                  {active ? <MaterialCommunityIcons name="check-circle" size={18} color={colors.pink} /> : null}
                </View>
                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                  {address.street || ''}{address.street && address.city ? ', ' : ''}{address.city || ''}
                </Text>
              </Pressable>
            );
          })
        )}

        {/* Vehicle Selection (Optional) */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Vehicle (Optional)</Text>
        {vehicles.length === 0 ? (
          <Pressable
            style={[styles.infoCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
            onPress={() => router.push('/add-vehicle')}
          >
            <MaterialCommunityIcons name="cart-plus" size={20} color={colors.pink} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>No vehicle added. Tap to add one.</Text>
          </Pressable>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.vehicleRow}>
            <Pressable
              style={[
                styles.vehicleChip,
                { borderColor: !selectedVehicleId ? colors.pink : colors.cardBorder },
              ]}
              onPress={() => setSelectedVehicleId(null)}
            >
              <Text style={[styles.vehicleChipText, { color: !selectedVehicleId ? colors.pink : colors.textSecondary }]}>
                No vehicle
              </Text>
            </Pressable>
            {vehicles.map((vehicle) => {
              const selected = selectedVehicleId === vehicle.vehicle_id;
              return (
                <Pressable
                  key={vehicle.vehicle_id}
                  style={[
                    styles.vehicleChip,
                    { borderColor: selected ? colors.pink : colors.cardBorder },
                  ]}
                  onPress={() => setSelectedVehicleId(vehicle.vehicle_id)}
                >
                  <Text style={[styles.vehicleChipText, { color: selected ? colors.pink : colors.textSecondary }]}>
                    {vehicle.year} {vehicle.model_name || vehicle.model}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Payment Method */}
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
                <MaterialCommunityIcons name={method.icon as any} size={20} color={active ? colors.pink : colors.textMuted} />
                <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{method.label}</Text>
              </View>
              {active ? <MaterialCommunityIcons name="radiobox-marked" size={18} color={colors.pink} /> : <MaterialCommunityIcons name="radiobox-blank" size={18} color={colors.textMuted} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Bottom Bar */}
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.lg,
  },
  headerTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
  content: { paddingHorizontal: Spacing.md, paddingBottom: 140 },
  summaryCard: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginTop: Spacing.md,
  },
  summaryTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  summaryPrice: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg, marginTop: 4 },
  summaryDuration: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 4 },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
  dateRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  dateChip: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    minWidth: 100,
  },
  dateChipLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginBottom: 2 },
  dateChipValue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  timeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  timeSlot: {
    width: '22%', borderWidth: 1, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm, alignItems: 'center',
  },
  timeSlotText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  infoCard: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
  },
  infoText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  addressCard: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  addressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  addressTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  addressText: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
  vehicleRow: { gap: Spacing.sm, paddingBottom: Spacing.xs },
  vehicleChip: {
    borderWidth: 1, borderRadius: BorderRadius.full,
    paddingVertical: 8, paddingHorizontal: Spacing.md,
  },
  vehicleChipText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  methodCard: {
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  methodLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md, paddingBottom: Spacing.lg,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
  },
  totalBlock: { justifyContent: 'center' },
  totalLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },
  confirmButton: {
    flex: 1, borderRadius: BorderRadius.md,
    alignItems: 'center', justifyContent: 'center', minHeight: 48,
  },
  confirmButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
