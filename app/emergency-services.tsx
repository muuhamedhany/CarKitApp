import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, Fonts, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { emergencyService, EmergencyServiceOption } from '@/services/api/emergency.service';
import { rowDirection, textAlign } from '@/utils/rtl';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.6, { duration: 1500 }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1500 }), -1, false);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.pulseCircle, { backgroundColor: color }, animatedStyle]} />
      <View style={[styles.solidDot, { backgroundColor: color }]} />
    </View>
  );
}

const getServiceConfig = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('towing') || lowerName.includes('ونش') || lowerName.includes('سحب')) {
    return { icon: 'truck-flatbed' as const, color: '#FF3D00' };
  }
  if (lowerName.includes('battery') || lowerName.includes('بطارية') || lowerName.includes('شحن')) {
    return { icon: 'car-battery' as const, color: '#FFAB00' };
  }
  if (lowerName.includes('tire') || lowerName.includes('إطار') || lowerName.includes('كاوتش')) {
    return { icon: 'car-tire-alert' as const, color: '#2979FF' };
  }
  if (lowerName.includes('key') || lowerName.includes('lock') || lowerName.includes('مفتاح') || lowerName.includes('قفل')) {
    return { icon: 'car-key' as const, color: '#9C27B0' };
  }
  if (lowerName.includes('fuel') || lowerName.includes('gas') || lowerName.includes('وقود') || lowerName.includes('بنزين')) {
    return { icon: 'gas-station' as const, color: '#00E676' };
  }
  return { icon: 'car-wrench' as const, color: '#FF3D00' };
};



export default function EmergencyServicesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t, isRTL } = useTranslation();
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

      {isDark && (
        <>
          <View style={[styles.orb, { top: -80, right: -120, backgroundColor: colors.pink + '18' }]} />
          <View style={[styles.orb, { bottom: 100, left: -140, backgroundColor: colors.purple + '12' }]} />
        </>
      )}

      {/* Set flexGrow: 1 to allow the content to fill the screen */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredHeader 
          title="Emergency Help"
          titleColor={colors.textPrimary} 
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.pink} />
          </View>
        ) : null}

        {!loading && services.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(500)}>
            <GlassView intensity={isDark ? 30 : 50} style={styles.empty} {...{} as any}>
              <MaterialCommunityIcons name="alert-circle-outline" size={38} color={colors.warning} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('emergency.services.empty')}</Text>
            </GlassView>
          </Animated.View>
        ) : null}

        {/* The Grid takes flex: 1 to stretch completely */}
        <View style={[styles.gridContainer, { flexDirection: rowDirection(isRTL) }]}>
          {services.slice(0, 4).map((service, index) => (
            <Animated.View
              key={service.service_id}
              entering={FadeInDown.delay(100 + index * 100).duration(500)}
              style={styles.gridItemWrapper}
            >
              <EmergencyServiceTile
                service={service}
                colors={colors}
                t={t}
                onPress={() => router.push({
                  pathname: '/emergency-request' as any,
                  params: { serviceId: service.service_id, serviceName: service.name, price: String(service.price || '') },
                })}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function EmergencyServiceTile({
  service,
  colors,
  onPress,
  t,
}: {
  service: EmergencyServiceOption;
  colors: ReturnType<typeof useTheme>['colors'];
  onPress: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const onlineCount = service.online_employee_count || 0;
  const assignedCount = service.assigned_employee_count || 0;
  const isAvailable = onlineCount > 0;

  const availabilityText = isAvailable ? 'Available' : 'Not Available';

  const config = getServiceConfig(service.name);
  const statusColor = isAvailable ? colors.success : assignedCount > 0 ? colors.warning : colors.textMuted;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tileContainer,
        {
          borderColor: 'rgba(255,255,255,0.08)',
          backgroundColor: pressed ? 'rgba(255,255,255,0.06)' : 'rgba(20,20,25,0.4)',
          transform: [{ scale: pressed ? 0.96 : 1 }]
        }
      ]}
      onPress={onPress}
    >
      <GlassView intensity={12} style={StyleSheet.absoluteFill} />

      <LinearGradient
        colors={[config.color + '15', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Huge Centered Icon */}
      <View style={styles.iconCenter}>
        <View style={[styles.iconGlowWrap, { backgroundColor: config.color + '10' }]}>
          <MaterialCommunityIcons name={config.icon} size={48} color={config.color} />
        </View>
      </View>

      {/* Texts */}
      <View style={styles.textCenter}>
        <Text numberOfLines={2} style={[styles.serviceTitle, { color: colors.textPrimary }]}>
          {service.name}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {/* Spacious Status & Pricing Area */}
      <View style={styles.bottomArea}>
        <View style={styles.statusBlock}>
          <PulsingDot color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {availabilityText}
          </Text>
        </View>

        <View style={[styles.priceBadge, { backgroundColor: colors.pink + '15' }]}>
          <Text style={[styles.priceText, { color: colors.pink }]}>
            {service.price ? `${service.price} EGP` : 'QUOTE'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.5,
  },
  content: {
    flexGrow: 1, // Ensures the layout can stretch to the bottom of the screen
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl
  },
  loaderContainer: { paddingVertical: Spacing.xxl, alignItems: 'center' },

  // Grid Styling
  gridContainer: {
    flex: 1, // Stretches the container to fill the screen
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Prevents wrapping by spacing horizontally
    alignContent: 'center', // Centers the rows vertically
    marginTop: Spacing.md,
  },
  gridItemWrapper: {
    width: '48%',
    height: '44%', // A little bit smaller than before
    marginBottom: Spacing.md, // Adds vertical space between rows safely
  },

  // Tile styling
  tileContainer: {
    flex: 1, // Fill the wrapper completely
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...Shadows.md,
  },

  iconCenter: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  iconGlowWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textCenter: {
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  serviceTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },

  bottomArea: {
    alignItems: 'center',
    paddingBottom: Spacing.lg,
  },
  statusBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  priceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    fontFamily: Fonts.extraBold,
    fontSize: 12,
  },

  // Pulsing dot
  dotContainer: {
    width: 6,
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  solidDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  empty: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
});
