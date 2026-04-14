import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useCart } from '@/contexts/CartContext';
import { addressService, orderService, paymentService, PaymentMethod } from '@/services/api';
import { CenteredHeader } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

type Address = {
  address_id: number;
  title?: string;
  street?: string;
  city?: string;
};

const paymentMethods: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: 'Cash on Delivery', value: 'cash_on_delivery', icon: 'cash' },
  { label: 'InstaPay', value: 'instapay', icon: 'bank-transfer' },
  { label: 'Vodafone Cash', value: 'vodafone_cash', icon: 'wallet-outline' },
  { label: 'Credit Card', value: 'credit_card', icon: 'credit-card-outline' },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { items, total, fetchCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const totalNumber = useMemo(() => Number(total) || 0, [total]);

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

    loadAddresses();
  }, [showToast]);

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      showToast('warning', 'Empty Cart', 'Add items before checkout.');
      return;
    }

    if (!selectedAddressId) {
      showToast('warning', 'Address Required', 'Please add/select a shipping address.');
      return;
    }

    try {
      setPlacingOrder(true);

      const orderRes = await orderService.createOrder({
        shipping_address_id: selectedAddressId,
      });

      if (!orderRes.success || !orderRes.data) {
        showToast('error', 'Order Failed', orderRes.message || 'Could not place order.');
        return;
      }

      const paymentRes = await paymentService.createPayment({
        order_id: orderRes.data.order_id,
        method: paymentMethod,
        amount: totalNumber,
      });

      if (!paymentRes.success) {
        showToast('error', 'Payment Failed', paymentRes.message || 'Order created, payment failed.');
        router.replace({
          pathname: '/order-failure' as any,
          params: {
            orderId: String(orderRes.data.order_id),
            amount: String(totalNumber),
            method: paymentMethod,
          },
        });
        return;
      }

      await fetchCart();
      router.replace({
        pathname: '/order-success' as any,
        params: { orderId: String(orderRes.data.order_id) },
      });
    } catch {
      showToast('error', 'Checkout Error', 'Something went wrong during checkout.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <CenteredHeader title="Checkout" titleColor={colors.textPrimary} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Text>

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

        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}> 
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
          <Text style={[styles.summaryLine, { color: colors.textSecondary }]}>Items: {items.length}</Text>
          <Text style={[styles.summaryTotal, { color: colors.textPrimary }]}>Total: {total} EGP</Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: colors.background }]}> 
        <Pressable
          onPress={handlePlaceOrder}
          disabled={placingOrder}
          style={[styles.placeButton, { backgroundColor: colors.pink, opacity: placingOrder ? 0.8 : 1 }]}
        >
          {placingOrder ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.placeButtonText}>Place Order</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingBottom: 140 },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
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
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  methodLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  summaryTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  summaryLine: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  summaryTotal: {
    marginTop: Spacing.sm,
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  placeButton: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  placeButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
});
