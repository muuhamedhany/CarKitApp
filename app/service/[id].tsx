import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, Pressable,
  ActivityIndicator, FlatList, Dimensions, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { ServiceDetailSkeleton } from '@/components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.1;

type ServiceDetail = {
  service_id: number;
  name: string;
  description: string;
  price: string;
  duration: number;
  category_name: string;
  provider_name: string;
  provider_id_fk?: number;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  location_type?: 'both' | 'mobile' | 'in-shop';
  available_times?: string[];
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchService();
  }, [id]);

  const fetchService = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/services/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setService(data.data);
      } else {
        showToast('error', 'Error', 'Service not found');
        router.back();
      }
    } catch {
      showToast('error', 'Error', 'Failed to fetch service details.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!service) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/booking-confirmation',
      params: {
        serviceId: String(service.service_id),
        serviceName: service.name,
        price: String(service.price),
        duration: String(service.duration),
        providerId: service.provider_id_fk ? String(service.provider_id_fk) : '',
        providerName: service.provider_name || '',
        availableTimes: JSON.stringify(service.available_times || []),
      },
    } as any);
  };

  if (loading) {
    return <ServiceDetailSkeleton />;
  }

  if (!service) return null;

  const images = [service.image_url, service.image_url_2, service.image_url_3].filter(Boolean) as string[];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />
      {/* Dynamic Glassmorphic Header */}
      <Animated.View style={[
        styles.stickyHeader,
        { height: insets.top + 50, opacity: headerOpacity }
      ]}>
        <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerContent, { marginTop: insets.top }]}>
           <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>{service.name}</Text>
        </View>
      </Animated.View>

      {/* Floating Back Button */}
      <View style={[styles.floatingControls, { top: insets.top + 10 }]}>
        <Pressable 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} 
          style={styles.floatingIconBtn}
        >
          <BlurView intensity={40} tint="dark" style={styles.blurWrap}>
             <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
          </BlurView>
        </Pressable>
        
        <View style={styles.rightFloatingControls}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.floatingIconBtn}>
            <BlurView intensity={40} tint="dark" style={styles.blurWrap}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#FFF" />
            </BlurView>
          </Pressable>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* Hero Gallery */}
        <View style={styles.heroContainer}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={({ viewableItems }) => {
                if (viewableItems.length > 0) {
                  setActiveImageIndex(viewableItems[0].index || 0);
                }
              }}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
              )}
            />
          ) : (
            <View style={[styles.heroImage, styles.center, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialCommunityIcons name="car-wash" size={80} color={colors.textMuted} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', colors.background]}
            style={styles.heroGradient}
          />
          
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i === activeImageIndex ? { width: 24, backgroundColor: colors.pink } : { backgroundColor: 'rgba(255,255,255,0.5)' }
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Service Info Content */}
        <View style={styles.mainContent}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
               <Text style={[styles.categoryText, { color: colors.pink }]}>{service.category_name?.toUpperCase() || 'SERVICE'}</Text>
               <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>{service.name}</Text>
            </View>
          </View>

          <View style={[styles.providerCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
             <View style={[styles.providerAvatar, { backgroundColor: colors.background }]}>
                <MaterialCommunityIcons name="shield-star-outline" size={20} color={colors.pink} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={[styles.providerLabel, { color: colors.textSecondary }]}>Service Provider</Text>
                <Text style={[styles.providerName, { color: colors.textPrimary }]}>{service.provider_name || 'Verified Partner'}</Text>
             </View>
             <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </View>

          <View style={styles.statsRow}>
             <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="clock-outline" size={22} color={colors.pink} />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{service.duration || '--'} min</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
             </View>
             <View style={[styles.statBox, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons 
                  name={service.location_type === 'mobile' ? 'car' : 'store'} 
                  size={22} color={colors.pink} 
                />
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                   {service.location_type === 'mobile' ? 'Mobile' : service.location_type === 'in-shop' ? 'In-Shop' : 'Both'}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Location</Text>
             </View>
          </View>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Service Details</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {service.description || 'Professional car care service provided by our certified experts.'}
          </Text>

          {service.available_times && service.available_times.length > 0 && (
            <>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: Spacing.xl }]}>Available Slots</Text>
              <View style={styles.timesRow}>
                {service.available_times.map((time, i) => (
                  <View key={i} style={[styles.timeChip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.timeChipText, { color: colors.textPrimary }]}>{time}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </Animated.ScrollView>

      {/* Glassmorphic Bottom Action Bar */}
      <View style={[styles.bottomBarContainer, { paddingBottom: insets.bottom + 10 }]}>
         <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.bottomBlur}>
            <View style={styles.bottomBarContent}>
               <View style={styles.priceInfo}>
                  <Text style={[styles.priceTag, { color: colors.textSecondary }]}>Starting at</Text>
                  <View style={styles.priceRow}>
                     <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{service.price}</Text>
                     <Text style={[styles.currency, { color: colors.pink }]}> EGP</Text>
                  </View>
               </View>
               
               <Pressable
                 onPress={handleBookNow}
                 style={({ pressed }) => [
                   styles.bookBtn,
                   { transform: [{ scale: pressed ? 0.96 : 1 }] }
                 ]}
               >
                 <LinearGradient
                   colors={[colors.pink, colors.purple]}
                   start={{ x: 0, y: 0 }}
                   end={{ x: 1, y: 0 }}
                   style={styles.bookBtnGradient}
                 >
                   <MaterialCommunityIcons name="calendar-check" size={20} color="#FFF" />
                   <Text style={styles.bookBtnText}>Book Now</Text>
                 </LinearGradient>
               </Pressable>
            </View>
         </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.5,
  },
  center: { justifyContent: 'center', alignItems: 'center' },

  stickyHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 20,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 70,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },

  floatingControls: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  rightFloatingControls: { flexDirection: 'row' },
  floatingIconBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  blurWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 150,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6, width: 6,
    borderRadius: 3,
  },

  mainContent: {
    paddingHorizontal: Spacing.lg,
    marginTop: -20,
  },
  titleRow: {
    marginBottom: Spacing.xl,
  },
  categoryText: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  serviceTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xxl,
    lineHeight: 32,
  },

  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  providerAvatar: {
    width: 40, height: 40,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  providerLabel: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 2 },
  providerName: { fontFamily: Fonts.bold, fontSize: FontSizes.md },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginTop: 4,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    opacity: 0.6,
  },

  sectionHeading: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 22,
    opacity: 0.8,
  },

  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeChipText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },

  bottomBarContainer: {
    position: 'absolute',
    bottom: 10,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 40,
  },
  bottomBlur: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadows.lg,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: 16,
  },
  priceInfo: {
    flex: 0.45,
  },
  priceTag: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceValue: { fontFamily: Fonts.extraBold, fontSize: 24, letterSpacing: -1 },
  currency: { fontFamily: Fonts.bold, fontSize: 12 },
  
  bookBtn: {
    flex: 0.55,
    height: 56,
  },
  bookBtnGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookBtnText: {
    color: '#FFF',
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
  },
});
