import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader, GradientButton } from '@/components';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

type Vehicle = {
  vehicle_id: number;
  nickname?: string;
  year?: number;
  color?: string;
  photo_url?: string;
  make_name: string;
  model_name: string;
};

export default function MyVehiclesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setVehicles(data.data);
    } catch {
      showToast('error', 'Error', 'Could not load vehicles.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleAddVehicle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-vehicle');
  };

  const handleVehiclePress = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/vehicle-detail', params: { vehicleId: id.toString() } } as any);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[isDark ? '#0F172A' : '#F8FAFC', isDark ? '#020617' : '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeInDown.duration(1000)} style={[styles.orb, styles.orb1, { backgroundColor: colors.pink }]} />
      <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={[styles.orb, styles.orb2, { backgroundColor: colors.purple }]} />

      <CenteredHeader title="My Vehicles" titleColor={colors.textPrimary} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {vehicles.length === 0 ? (
            <Animated.View 
              entering={FadeInDown.delay(400).duration(800)}
              style={styles.emptyState}
            >
              <BlurView
                intensity={isDark ? 30 : 50}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.emptyCard, { borderColor: 'rgba(255,255,255,0.1)' }]}
              >
                <View style={[styles.emptyIconCircle, { backgroundColor: colors.pink + '15' }]}>
                  <MaterialCommunityIcons name="car-off" size={64} color={colors.pink} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No vehicles yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Add your first vehicle to personalize your experience and track history.
                </Text>
                <GradientButton
                  title="Add Now"
                  onPress={handleAddVehicle}
                  style={styles.emptyAddBtn}
                />
              </BlurView>
            </Animated.View>
          ) : (
            <View style={styles.listContainer}>
              {vehicles.map((v, index) => (
                <Animated.View 
                  key={v.vehicle_id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  layout={Layout.springify()}
                >
                  <Pressable
                    onPress={() => handleVehiclePress(v.vehicle_id)}
                  >
                    <BlurView
                      intensity={isDark ? 30 : 50}
                      tint={isDark ? 'dark' : 'light'}
                      style={[styles.vehicleCard, { borderColor: 'rgba(255,255,255,0.1)' }]}
                    >
                      <View style={styles.vehicleThumb}>
                        {v.photo_url ? (
                          <Image source={{ uri: v.photo_url }} style={styles.vehicleThumbImg} />
                        ) : (
                          <LinearGradient
                            colors={[colors.pink, colors.purple]}
                            style={styles.vehicleThumbPlaceholder}
                          >
                            <MaterialCommunityIcons name="car-side" size={32} color="white" />
                          </LinearGradient>
                        )}
                      </View>
                      <View style={styles.vehicleInfo}>
                        <Text style={[styles.vehicleName, { color: colors.textPrimary }]}>
                          {v.nickname || `${v.make_name} ${v.model_name}`}
                        </Text>
                        <Text style={[styles.vehicleSub, { color: colors.textSecondary }]}>
                          {v.year ? `${v.year} • ` : ''}{v.make_name}
                        </Text>
                        <View style={[styles.modelBadge, { backgroundColor: colors.pink + '15' }]}>
                          <Text style={[styles.modelBadgeText, { color: colors.pink }]}>{v.model_name}</Text>
                        </View>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </BlurView>
                  </Pressable>
                </Animated.View>
              ))}

              <Animated.View entering={FadeInDown.delay(400).springify()}>
                <GradientButton
                  title="Add Another Vehicle"
                  icon="plus"
                  onPress={handleAddVehicle}
                  style={styles.bottomAddBtn}
                />
              </Animated.View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4, opacity: 0.12 },
  orb1: { top: -width * 0.2, right: -width * 0.2 },
  orb2: { bottom: height * 0.1, left: -width * 0.3 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },
  listContainer: { gap: Spacing.md },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  vehicleThumb: {
    width: 80,
    height: 60,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.lg,
    overflow: 'hidden',
  },
  vehicleThumbImg: { width: '100%', height: '100%' },
  vehicleThumbPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  vehicleInfo: { flex: 1 },
  vehicleName: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2, letterSpacing: 0.3 },
  vehicleSub: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, opacity: 0.6, marginBottom: 6 },
  modelBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.md },
  modelBadgeText: { fontSize: 10, fontFamily: Fonts.bold, textTransform: 'uppercase', letterSpacing: 1 },

  bottomAddBtn: { marginTop: Spacing.lg },

  emptyState: { marginTop: 40 },
  emptyCard: { padding: Spacing.xxl, borderRadius: BorderRadius.xxl, borderWidth: 1, alignItems: 'center', overflow: 'hidden' },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginBottom: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.md, textAlign: 'center', opacity: 0.6, marginBottom: Spacing.xl, lineHeight: 22 },
  emptyAddBtn: { width: '100%' },
});
