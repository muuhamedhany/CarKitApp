import { CenteredHeader, GlassView } from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Multi-Layered Background */}
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Atmospheric Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <CenteredHeader title="Garage" titleColor={colors.textPrimary} />

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
            <Animated.View entering={FadeInDown} style={styles.emptyWrapper}>
              <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIconCircle, { borderColor: 'rgba(255,255,255,0.1)' }]}>
                <MaterialCommunityIcons name="car-outline" size={56} color={colors.pink} />
              </GlassView>
              
              <Text style={[styles.emptyTitleText, { color: colors.textPrimary }]}>Garage is Empty</Text>
              <Text style={[styles.emptySubtitleText, { color: colors.textSecondary }]}>
                Register your vehicle to unlock personalized maintenance schedules and history.
              </Text>
              
              <Pressable onPress={handleAddVehicle}>
                <LinearGradient
                  colors={[colors.pink, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.pillButton}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="white" />
                  <Text style={styles.pillButtonText}>Add New Vehicle</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ) : (

            <View style={styles.listContainer}>
              {vehicles.map((v, index) => (
                <Animated.View
                  key={v.vehicle_id}
                  entering={FadeInUp.delay(index * 120).springify()}
                  layout={Layout.springify()}
                >
                  <Pressable
                    onPress={() => handleVehiclePress(v.vehicle_id)}
                    style={({ pressed }) => [
                      styles.vehicleCardWrapper,
                      { transform: [{ scale: pressed ? 0.98 : 1 }] }
                    ]}
                  >
                    <GlassView
                      intensity={isDark ? 30 : 50}
                      tint={isDark ? 'dark' : 'light'}
                      style={[styles.vehicleCard, { borderColor: colors.cardBorder }]}
                    >
                      {/* Shorter Image Section */}
                      <View style={styles.imageContainer}>
                        {v.photo_url ? (
                          <Image source={{ uri: v.photo_url }} style={styles.vehicleImage} />
                        ) : (
                          <LinearGradient
                            colors={isDark ? ['#1e1e2d', '#11111a'] : ['#f0f0f5', '#e6e6f0']}
                            style={styles.imagePlaceholder}
                          >
                            <MaterialCommunityIcons 
                              name="car-sports" 
                              size={60} 
                              color={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 
                            />
                          </LinearGradient>
                        )}
                        
                        {/* Status Overlay Only */}
                        <View style={styles.imageOverlay}>
                          <View style={[styles.activeStatus, { backgroundColor: colors.success + '20' }]}>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.statusText, { color: colors.success }]}>ACTIVE</Text>
                          </View>
                        </View>
                      </View>

                      {/* Unified Content Section */}
                      <View style={styles.cardContent}>
                        <View style={styles.headerRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.nickname, { color: colors.textPrimary }]} numberOfLines={1}>
                              {v.nickname || `${v.make_name} ${v.model_name}`}
                            </Text>
                            <Text style={[styles.fullModel, { color: colors.textSecondary }]}>
                              {v.make_name} • <Text style={{ color: colors.pink }}>{v.model_name}</Text>
                            </Text>
                          </View>
                          
                          <View style={[styles.arrowContainer, { backgroundColor: colors.pink + '15' }]}>
                            <MaterialCommunityIcons name="arrow-right" size={20} color={colors.pink} />
                          </View>
                        </View>

                        {/* Integrated Data Badges */}
                        <View style={styles.dataBadgeRow}>
                          <View style={[styles.dataBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <MaterialCommunityIcons name="calendar" size={14} color={colors.textSecondary} />
                            <Text style={[styles.dataBadgeText, { color: colors.textPrimary }]}>{v.year || 'N/A'}</Text>
                          </View>
                          
                          {v.color && (
                            <View style={[styles.dataBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                              <View style={[styles.colorIndicator, { backgroundColor: v.color.toLowerCase() }]} />
                              <Text style={[styles.dataBadgeText, { color: colors.textPrimary }]}>{v.color}</Text>
                            </View>
                          )}
                          
                          <View style={[styles.dataBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                            <MaterialCommunityIcons name="shield-check-outline" size={14} color={colors.pink} />
                            <Text style={[styles.dataBadgeText, { color: colors.textPrimary }]}>Insured</Text>
                          </View>
                        </View>
                      </View>
                    </GlassView>
                  </Pressable>
                </Animated.View>
              ))}

              {/* Sophisticated Add Button */}
              <Animated.View entering={FadeInUp.delay(vehicles.length * 120 + 200).springify()}>
                <Pressable
                  onPress={handleAddVehicle}
                  style={({ pressed }) => [
                    styles.secondaryAddBtn,
                    { 
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                      borderColor: colors.cardBorder
                    }
                  ]}
                >
                  <View style={[styles.plusIconWrap, { backgroundColor: colors.pink + '15' }]}>
                    <MaterialCommunityIcons name="plus" size={24} color={colors.pink} />
                  </View>
                  <Text style={[styles.secondaryAddText, { color: colors.textPrimary }]}>Add Another Vehicle</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
  listContainer: { gap: Spacing.xl },

  // Vehicle Card Design
  vehicleCardWrapper: {
    ...Shadows.lg,
  },
  vehicleCard: {
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 140, // Shorter picture
    backgroundColor: '#000',
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  cardContent: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  nickname: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  fullModel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    opacity: 0.8,
  },
  arrowContainer: {
    width: 44,
    height: 44,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },

  // Data Badges
  dataBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  dataBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  colorIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },

  // Secondary Add Button
  secondaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.md,
  },
  plusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  secondaryAddText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },

  // Redesigned Empty State
  emptyWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: height * 0.1,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  emptyTitleText: {
    fontFamily: Fonts.bold,
    fontSize: 24,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitleText: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: 30,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    ...Shadows.md,
  },
  pillButtonText: {
    color: 'white',
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
});

