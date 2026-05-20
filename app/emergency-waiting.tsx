import { CenteredHeader, GlassView } from '@/components';
import EmergencyRouteMap, { RouteCoordinate } from '@/components/EmergencyRouteMap';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { emergencyService, type CoordinateValue, type EmergencyRequest } from '@/services/api/emergency.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AVERAGE_CITY_SPEED_KMH = 32;

const toFiniteNumber = (value: CoordinateValue | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toCoordinate = (
  latValue: CoordinateValue | undefined,
  lngValue: CoordinateValue | undefined
): RouteCoordinate | null => {
  const latitude = toFiniteNumber(latValue);
  const longitude = toFiniteNumber(lngValue);
  return latitude === null || longitude === null ? null : { latitude, longitude };
};

const getDistanceKm = (from: RouteCoordinate, to: RouteCoordinate) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distanceKm: number) => (
  distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`
);

const buildEta = (customer: RouteCoordinate | null, employee: RouteCoordinate | null) => {
  if (!customer || !employee) {
    return { eta: 'Calculating', distance: 'Waiting for GPS' };
  }

  const distanceKm = getDistanceKm(employee, customer);
  if (distanceKm < 0.12) {
    return { eta: 'Arriving now', distance: formatDistance(distanceKm) };
  }

  const minutes = Math.max(1, Math.round((distanceKm / AVERAGE_CITY_SPEED_KMH) * 60));
  return { eta: `${minutes} min`, distance: formatDistance(distanceKm) };
};

const formatLocationAge = (value: string | undefined, now: number) => {
  if (!value) return 'waiting for update';
  const updatedAt = new Date(value).getTime();
  if (!Number.isFinite(updatedAt)) return 'waiting for update';
  const ageSeconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
  if (ageSeconds < 10) return 'updated now';
  if (ageSeconds < 60) return `updated ${ageSeconds}s ago`;
  return `updated ${Math.floor(ageSeconds / 60)}m ago`;
};

export default function EmergencyWaitingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    const res = await emergencyService.getMyActiveRequest();
    setRequest(res.data || null);
  };

  useEffect(() => {
    load();
    const statusId = setInterval(load, 5000);
    const tickId = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(statusId); clearInterval(tickId); };
  }, []);

  const seconds = useMemo(() => Math.max(0, Math.ceil(((request?.expires_at ? new Date(request.expires_at).getTime() : now) - now) / 1000)), [request?.expires_at, now]);
  const status = String(request?.status || '').toLowerCase();
  const employeeName = request?.employee_full_name || request?.employee_name || t('emergency.waiting.employee');
  const employeePhone = request?.employee_phone?.trim();
  const customerCoordinate = useMemo(
    () => toCoordinate(request?.customer_lat ?? request?.latitude, request?.customer_lng ?? request?.longitude),
    [request?.customer_lat, request?.customer_lng, request?.latitude, request?.longitude]
  );
  const employeeCoordinate = useMemo(
    () => toCoordinate(request?.tracking_lat ?? request?.employee_lat, request?.tracking_lng ?? request?.employee_lng),
    [request?.employee_lat, request?.employee_lng, request?.tracking_lat, request?.tracking_lng]
  );
  const arrival = useMemo(() => buildEta(customerCoordinate, employeeCoordinate), [customerCoordinate, employeeCoordinate]);
  const locationAge = useMemo(
    () => formatLocationAge(request?.tracking_recorded_at || request?.employee_last_seen_at, now),
    [request?.employee_last_seen_at, request?.tracking_recorded_at, now]
  );

  const cancel = async () => {
    if (!request) return;
    await emergencyService.cancelRequest(request.request_id);
    router.replace('/(tabs)' as any);
  };

  const openMaps = () => {
    const target = employeeCoordinate || customerCoordinate;
    if (!target) return;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${target.latitude},${target.longitude}`);
  };

  const callEmployee = () => {
    if (!employeePhone) return;
    const phone = employeePhone.replace(/[^\d+]/g, '');
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredHeader
          title="Emergency Request"
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />
        <GlassView intensity={isDark ? 30 : 50} style={styles.card} {...{} as any}>
          {!request || status === 'searching' ? (
            <>
              <ActivityIndicator size="large" color={colors.error} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{t('emergency.waiting.finding')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('emergency.waiting.remaining', { seconds })}</Text>
              {request ? <Pressable style={styles.linkButton} onPress={cancel}><Text style={[styles.linkText, { color: colors.error }]}>{t('common.cancel')}</Text></Pressable> : null}
            </>
          ) : status === 'completed' ? (
            <>
              <MaterialCommunityIcons name="check-circle-outline" size={46} color={colors.success} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{t('emergency.waiting.completed')}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('emergency.waiting.completedSub')}</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={() => router.replace('/(tabs)' as any)}>
                <Text style={styles.primaryText}>{t('emergency.waiting.goHome')}</Text>
              </Pressable>
            </>
          ) : status === 'expired' ? (
            <>
              <MaterialCommunityIcons name="timer-off-outline" size={42} color={colors.warning} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{t('emergency.waiting.noneAvailable')}</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: colors.error }]} onPress={() => router.replace('/emergency-services' as any)}>
                <Text style={styles.primaryText}>{t('common.tryAgain')}</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => router.replace('/(tabs)' as any)}><Text style={[styles.linkText, { color: colors.textSecondary }]}>{t('emergency.waiting.goHome')}</Text></Pressable>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="car-clock" size={42} color={colors.pink} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {status === 'arrived' ? t('emergency.waiting.arrived') : t('emergency.waiting.onWay', { name: employeeName })}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{employeePhone || t('emergency.waiting.phoneUnavailable')}</Text>
              <View style={styles.statusRow}>
                {['accepted', 'arrived', 'completed'].map((step) => (
                  <View key={step} style={[styles.statusStep, { backgroundColor: step === status ? colors.accentSoft : colors.surfaceMuted }]}>
                    <Text style={[styles.statusText, { color: step === status ? colors.pink : colors.textMuted }]}>{step}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.tripSummary, { backgroundColor: colors.surfaceMuted, borderColor: colors.cardBorder }]}>
                <View style={styles.tripMetric}>
                  <Text style={[styles.tripLabel, { color: colors.textMuted }]}>{t('emergency.waiting.eta')}</Text>
                  <Text style={[styles.tripValue, { color: colors.textPrimary }]}>{arrival.eta}</Text>
                </View>
                <View style={[styles.tripDivider, { backgroundColor: colors.dividerLine }]} />
                <View style={styles.tripMetric}>
                  <Text style={[styles.tripLabel, { color: colors.textMuted }]}>{t('emergency.waiting.distance')}</Text>
                  <Text style={[styles.tripValue, { color: colors.textPrimary }]}>{arrival.distance}</Text>
                </View>
              </View>
              <EmergencyRouteMap customer={customerCoordinate} employee={employeeCoordinate} />
              <View style={styles.locationMeta}>
                <MaterialCommunityIcons
                  name={employeeCoordinate ? 'crosshairs-gps' : 'crosshairs-question'}
                  size={16}
                  color={employeeCoordinate ? colors.pink : colors.warning}
                />
                <Text style={[styles.locationMetaText, { color: colors.textSecondary }]}>
                  {employeeCoordinate ? locationAge : t('emergency.waiting.gpsWaiting')}
                </Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable
                  disabled={!employeePhone}
                  onPress={callEmployee}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: colors.pink,
                      opacity: !employeePhone ? 0.45 : pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="phone" size={19} color="#fff" />
                  <Text style={styles.actionButtonText}>{t('emergency.waiting.call')}</Text>
                </Pressable>
                <Pressable
                  disabled={!employeeCoordinate && !customerCoordinate}
                  onPress={openMaps}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.secondaryAction,
                    {
                      borderColor: colors.cardBorder,
                      backgroundColor: pressed ? colors.surfacePressed : colors.surfaceMuted,
                      opacity: !employeeCoordinate && !customerCoordinate ? 0.45 : 1,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name="map-marker-path" size={19} color={colors.textPrimary} />
                  <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>{t('emergency.waiting.map')}</Text>
                </Pressable>
              </View>
            </>
          )}
        </GlassView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xl, gap: Spacing.md },
  card: { padding: Spacing.xl, borderRadius: BorderRadius.xl, alignItems: 'center', gap: Spacing.md, borderWidth: 1 },
  title: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, textAlign: 'center' },
  primaryButton: { minHeight: 52, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, alignSelf: 'stretch' },
  primaryText: { color: '#fff', fontFamily: Fonts.bold, textTransform: 'uppercase' },
  linkButton: { padding: Spacing.sm },
  linkText: { fontFamily: Fonts.bold },
  statusRow: { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' },
  statusStep: { flex: 1, borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, alignItems: 'center' },
  statusText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, textTransform: 'uppercase' },
  tripSummary: {
    alignSelf: 'stretch',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripMetric: { flex: 1, gap: 2 },
  tripLabel: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, textTransform: 'uppercase' },
  tripValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.md },
  tripDivider: { width: 1, height: 36, marginHorizontal: Spacing.md },
  locationMeta: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs },
  locationMetaText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  actionRow: { alignSelf: 'stretch', flexDirection: 'row', gap: Spacing.sm },
  actionButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  secondaryAction: { borderWidth: 1 },
  actionButtonText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.sm, textTransform: 'uppercase' },
});
