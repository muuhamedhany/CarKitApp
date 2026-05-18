import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { emergencyService, EmergencyServiceOption } from '@/services/api/emergency.service';

export default function EmergencyServicesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const [services, setServices] = useState<EmergencyServiceOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    emergencyService.getServices()
      .then((res) => {
        if (mounted) setServices(res.data || []);
      })
      .catch(() => {
        if (mounted) {
          setServices([]);
          showToast('error', 'Emergency Services', 'Could not load emergency services.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [showToast]);

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
          <EmergencyServiceTile
            key={service.service_id}
            service={service}
            colors={colors}
            onPress={() => router.push({
              pathname: '/emergency-request' as any,
              params: { serviceId: service.service_id, serviceName: service.name, price: String(service.price || '') },
            })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function EmergencyServiceTile({
  service,
  colors,
  onPress,
}: {
  service: EmergencyServiceOption;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
}) {
  const onlineCount = service.online_employee_count || 0;
  const assignedCount = service.assigned_employee_count || 0;
  const availabilityText = onlineCount > 0
    ? `${onlineCount} available now`
    : `${assignedCount} assigned, none online`;

  return (
    <Pressable
      style={[styles.tile, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: colors.errorSoft }]}>
        <MaterialCommunityIcons name="wrench-clock" size={26} color={colors.error} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.textPrimary }]}>{service.name}</Text>
        <Text style={[styles.meta, { color: onlineCount > 0 ? colors.textSecondary : colors.warning }]}>
          {availabilityText}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
    </Pressable>
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
