import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { emergencyService, EmergencyRequest } from '@/services/api/emergency.service';

export default function EmergencyWaitingScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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

  const cancel = async () => {
    if (!request) return;
    await emergencyService.cancelRequest(request.request_id);
    router.replace('/(tabs)' as any);
  };

  const openMaps = () => {
    const lat = request?.tracking_lat || request?.employee_lat;
    const lng = request?.tracking_lng || request?.employee_lng;
    if (lat && lng) Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <CenteredHeader title="Emergency Request" titleColor={colors.textPrimary} />
        <GlassView intensity={isDark ? 30 : 50} style={styles.card} {...{} as any}>
          {!request || request.status === 'searching' ? (
            <>
              <ActivityIndicator size="large" color={colors.error} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>Finding someone near you...</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{seconds}s remaining</Text>
              {request ? <Pressable style={styles.linkButton} onPress={cancel}><Text style={[styles.linkText, { color: colors.error }]}>Cancel</Text></Pressable> : null}
            </>
          ) : request.status === 'expired' ? (
            <>
              <MaterialCommunityIcons name="timer-off-outline" size={42} color={colors.warning} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>No one was available.</Text>
              <Pressable style={[styles.primaryButton, { backgroundColor: colors.error }]} onPress={() => router.replace('/emergency-services' as any)}>
                <Text style={styles.primaryText}>Try Again</Text>
              </Pressable>
              <Pressable style={styles.linkButton} onPress={() => router.replace('/(tabs)' as any)}><Text style={[styles.linkText, { color: colors.textSecondary }]}>Go Home</Text></Pressable>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="car-clock" size={42} color={colors.success} />
              <Text style={[styles.title, { color: colors.textPrimary }]}>{request.employee_full_name || request.employee_name || 'Employee'} is on the way</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{request.employee_phone || 'Phone unavailable'}</Text>
              <View style={styles.statusRow}>
                {['accepted', 'arrived', 'completed'].map((step) => (
                  <View key={step} style={[styles.statusStep, { backgroundColor: step === request.status ? colors.successSoft : colors.surfaceMuted }]}>
                    <Text style={[styles.statusText, { color: step === request.status ? colors.success : colors.textMuted }]}>{step}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={[styles.primaryButton, { backgroundColor: colors.success }]} onPress={openMaps}>
                <Text style={styles.primaryText}>View Location</Text>
              </Pressable>
            </>
          )}
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.md, justifyContent: 'center' },
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
});
