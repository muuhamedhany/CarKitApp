import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { paymentService, PaymentMethod } from '@/services/api/payment.service';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

export default function OrderFailureScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [retrying, setRetrying] = useState(false);

  const params = useLocalSearchParams<{ orderId?: string; amount?: string; method?: string }>();
  const orderId = Number(params.orderId || 0);
  const amount = Number(params.amount || 0);
  const method = (params.method || 'cash_on_delivery') as PaymentMethod;

  const retryPayment = async () => {
    if (!orderId || !amount) {
      showToast('error', 'Retry Error', 'Missing payment context.');
      return;
    }

    try {
      setRetrying(true);
      const res = await paymentService.createPayment({ order_id: orderId, amount, method });
      if (!res.success) {
        showToast('error', 'Retry Failed', res.message || 'Payment retry failed.');
        return;
      }
      showToast('success', 'Payment Added', 'Payment recorded successfully.');
      router.replace({ pathname: '/order-success' as any, params: { orderId: String(orderId) } });
    } catch {
      showToast('error', 'Retry Failed', 'Could not retry payment right now.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <MaterialCommunityIcons name="alert-circle" size={72} color={colors.error} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>Payment Failed</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}> 
        Order #{orderId || '-'} was created, but payment could not be completed.
      </Text>

      <Pressable style={[styles.button, { backgroundColor: colors.pink }]} onPress={retryPayment} disabled={retrying}>
        {retrying ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Retry Payment</Text>}
      </Pressable>

      <Pressable style={[styles.secondary, { borderColor: colors.cardBorder }]} onPress={() => router.replace('/my-orders')}>
        <Text style={[styles.secondaryText, { color: colors.textPrimary }]}>Continue to Orders</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    marginTop: Spacing.md,
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xxl,
  },
  subtitle: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  button: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.md,
    minHeight: 48,
    minWidth: 210,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  secondary: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 44,
    minWidth: 210,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
});
