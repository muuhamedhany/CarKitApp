import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { emergencyService } from '@/services/api/emergency.service';
import { Service } from '@/types/api.types';

export default function EmergencyServicesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [services, setServices] = useState<Array<Service & { online_employee_count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    emergencyService.getServices()
      .then((res) => setServices(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.bgGradientStart, colors.bgGradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content}>
        <CenteredHeader title="Emergency Services" titleColor={colors.textPrimary} />
        {loading ? <ActivityIndicator color={colors.pink} /> : null}
        {!loading && services.length === 0 ? (
          <GlassView intensity={isDark ? 30 : 50} style={styles.empty} {...{} as any}>
            <MaterialCommunityIcons name="alert-circle-outline" size={34} color={colors.warning} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No emergency services available right now. Please try again later or call 123 for assistance.</Text>
          </GlassView>
        ) : null}
        {services.map((service) => (
          <Pressable
            key={service.service_id}
            style={[styles.tile, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}
            onPress={() => router.push({ pathname: '/emergency-request' as any, params: { serviceId: service.service_id, serviceName: service.name, price: String(service.price || '') } })}
          >
            <View style={[styles.iconBox, { backgroundColor: colors.errorSoft }]}>
              <MaterialCommunityIcons name="wrench-clock" size={26} color={colors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{service.name}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{service.online_employee_count} available now</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  tile: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  meta: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2 },
  empty: { padding: Spacing.xl, borderRadius: BorderRadius.xl, alignItems: 'center', gap: Spacing.md },
  emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, textAlign: 'center', lineHeight: 22 },
});
