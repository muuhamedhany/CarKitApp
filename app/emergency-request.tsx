import {
  CenteredHeader,
  GlassView,
  MapLocationPicker } from '@/components';
import { BorderRadius,
  FontSizes,
  Fonts,
  Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { emergencyService } from '@/services/api/emergency.service';
import { PaymentMethod } from '@/services/api/payment.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '@/components/common/LocalizedText';

const methods: { key: PaymentMethod; labelKey: string; icon: string }[] = [
  { key: 'cash_on_delivery', labelKey: 'emergency.request.cashOnDelivery', icon: 'cash' },
  { key: 'credit_card', labelKey: 'emergency.request.creditCard', icon: 'credit-card-outline' },
];

export default function EmergencyRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ serviceId: string; serviceName: string; price?: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!location) {
      setPickerVisible(true);
      return;
    }
    setSubmitting(true);
    try {
      const res = await emergencyService.createRequest({
        service_id: Number(params.serviceId),
        lat: location.latitude,
        lng: location.longitude,
        customer_address: location.formattedAddress,
        payment_method: paymentMethod,
      });
      router.replace({ pathname: '/emergency-waiting' as any, params: { requestId: res.data?.request_id } });
    } catch {
      showToast('error', t('emergency.request.title'), t('emergency.request.sendFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <CenteredHeader
          title={params.serviceName || t('emergency.request.title')}
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />
        <GlassView intensity={isDark ? 30 : 50} style={styles.card} {...{} as any}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('emergency.request.location')}</Text>
          <Pressable style={[styles.locationBox, { borderColor: colors.cardBorder }]} onPress={() => setPickerVisible(true)}>
            <MaterialCommunityIcons name="map-marker-radius" size={24} color={colors.error} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{location?.formattedAddress || t('emergency.request.dropPin')}</Text>
          </Pressable>
        </GlassView>
        <GlassView intensity={isDark ? 30 : 50} style={styles.card} {...{} as any}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('emergency.request.payment')}</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('emergency.request.estimatedRange', { amount: params.price ? `${params.price} ${t('common.currency.egp')}` : `50-150 ${t('common.currency.egp')}` })}</Text>
          <View style={styles.methodGrid}>
            {methods.map((method) => (
              <Pressable
                key={method.key}
                style={[styles.method, { borderColor: paymentMethod === method.key ? colors.error : colors.cardBorder, backgroundColor: paymentMethod === method.key ? colors.errorSoft : 'transparent' }]}
                onPress={() => setPaymentMethod(method.key)}
              >
                <MaterialCommunityIcons name={method.icon as any} size={22} color={paymentMethod === method.key ? colors.error : colors.textSecondary} />
                <Text style={[styles.methodText, { color: colors.textPrimary }]}>{t(method.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </GlassView>
        <Pressable style={[styles.submit, { backgroundColor: colors.error }]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('emergency.request.send')}</Text>}
        </Pressable>
      </ScrollView>
      <MapLocationPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onLocationSelected={(result) => setLocation(result)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xxl },
  card: { padding: Spacing.lg, borderRadius: BorderRadius.xl, marginBottom: Spacing.md, borderWidth: 1 },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.md },
  locationBox: { minHeight: 88, borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  locationText: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  hint: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginBottom: Spacing.md },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  method: { width: '48%', borderWidth: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm },
  methodText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs },
  submit: { minHeight: 56, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md, textTransform: 'uppercase' },
});
