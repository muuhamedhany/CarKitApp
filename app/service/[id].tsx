import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolate,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView, RatingAnalysis, ServiceDetailSkeleton, StarRating } from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { reviewService } from '@/services/api/review.service';
import { Review } from '@/types/api.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;

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
  rating?: number;
  review_count?: number;
};

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [service, setService] = useState<ServiceDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [filterRating, setFilterRating] = useState<number | null>(null);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  useEffect(() => {
    fetchService();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const resp = await reviewService.getServiceReviews(Number(id));
      if (resp.success) {
        setReviews(resp.data || []);
      }
    } catch (err) {
      console.log('Error fetching service reviews:', err);
    }
  };

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

  // ─── Animations ─────────────────────────────────────────────────────────────

  const heroStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolate.CLAMP);
    const opacity = interpolate(scrollY.value, [0, HERO_HEIGHT * 0.8], [1, 0.4], Extrapolate.CLAMP);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [HERO_HEIGHT * 0.4, HERO_HEIGHT * 0.6], [0, 1], Extrapolate.CLAMP);
    return { opacity };
  });

  const backBtnStyle = useAnimatedStyle(() => {
    const backgroundColor = scrollY.value > 100 ? colors.backgroundSecondary : 'rgba(0,0,0,0.3)';
    return { backgroundColor };
  });

  const filteredReviews = filterRating
    ? reviews.filter(r => Math.round(r.rating || 0) === filterRating)
    : reviews;

  if (loading) return <ServiceDetailSkeleton />;
  if (!service) return null;

  const images = [service.image_url, service.image_url_2, service.image_url_3].filter(Boolean) as string[];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Atmosphere */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: colors.purple + '10' }]} />

      {/* Dynamic Header */}
      <Animated.View style={[styles.stickyHeader, { height: insets.top + 60 }, headerStyle]}>
        <GlassView intensity={40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerContent, { marginTop: insets.top }]}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>{service.name}</Text>
        </View>
      </Animated.View>

      {/* Floating Controls */}
      <View style={[styles.floatingControls, { top: insets.top + 10 }]}>
        <Animated.View style={[styles.floatingIconBtn, backBtnStyle]}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={styles.btnInner}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={isDark ? '#FFF' : '#000'} />
          </Pressable>
        </Animated.View>

        <View style={styles.rightFloatingControls}>
          <Animated.View style={[styles.floatingIconBtn, backBtnStyle]}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} style={styles.btnInner}>
              <MaterialCommunityIcons name="share-variant" size={20} color={isDark ? '#FFF' : '#000'} />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
      >
        {/* Hero Gallery */}
        <Animated.View style={[styles.heroContainer, heroStyle]}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(_, i) => i.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              renderItem={({ item }) => (
                <View style={styles.heroImageWrapper}>
                  <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
                </View>
              )}
            />
          ) : (
            <View style={[styles.heroImage, styles.center, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialCommunityIcons name="car-wash" size={80} color={colors.textMuted} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', colors.background]}
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
        </Animated.View>

        {/* Main Info Card */}
        <View style={styles.contentWrapper}>
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.mainInfoCard}>
              <View style={styles.badgeRow}>
                <View style={[styles.categoryBadge, { backgroundColor: colors.pink + '20' }]}>
                  <Text style={[styles.categoryText, { color: colors.pink }]}>{service.category_name?.toUpperCase() || 'SERVICE'}</Text>
                </View>
                <View style={[styles.locationBadge, { backgroundColor: colors.purple + '20' }]}>
                  <MaterialCommunityIcons
                    name={service.location_type === 'mobile' ? 'car' : 'storefront'}
                    size={12}
                    color={colors.purple}
                  />
                  <Text style={[styles.locationText, { color: colors.purple }]}>
                    {service.location_type === 'mobile' ? 'MOBILE SERVICE' : service.location_type === 'in-shop' ? 'IN-SHOP ONLY' : 'FLEXIBLE LOCATION'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.serviceTitle, { color: colors.textPrimary }]}>{service.name}</Text>

              <View style={styles.ratingRow}>
                <StarRating rating={service.rating || 0} size={16} readonly />
                <Text style={[styles.ratingValue, { color: colors.textPrimary }]}>
                  {service.rating ? Number(service.rating).toFixed(1) : '0.0'}
                </Text>
                <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                  ({service.review_count || 0} reviews)
                </Text>
              </View>

              <Text style={[styles.sectionHeadingSmall, { color: colors.textPrimary }]}>Service Details</Text>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                {service.description || 'Professional car care service provided by our certified experts.'}
              </Text>

              <Pressable
                style={[styles.providerRow, { borderTopColor: colors.cardBorder }]}
                onPress={() => service.provider_id_fk && router.push(`/provider/${service.provider_id_fk}`)}
              >
                <View style={[styles.providerIconWrap, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="shield-star-outline" size={18} color={colors.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.providerLabel, { color: colors.textSecondary }]}>Provided by</Text>
                  <Text style={[styles.providerName, { color: colors.textPrimary }]}>{service.provider_name || 'Verified Partner'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </GlassView>
          </Animated.View>

          {/* Stats Grid */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={colors.pink} />
              <View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{service.duration || '--'} min</Text>
              </View>
            </View>
            <View style={[styles.statItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color={colors.pink} />
              <View>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Protection</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>Insured</Text>
              </View>
            </View>
          </Animated.View>

          {/* Available Slots */}
          {service.available_times && service.available_times.length > 0 && (
            <Animated.View entering={FadeInUp.delay(500).springify()} style={styles.section}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>Available Slots</Text>
              <View style={styles.slotsGrid}>
                {service.available_times.map((time, i) => (
                  <View key={i} style={[styles.slotChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: colors.cardBorder }]}>
                    <MaterialCommunityIcons name="clock-check-outline" size={12} color={colors.pink} style={{ marginRight: 6 }} />
                    <Text style={[styles.slotText, { color: colors.textPrimary }]}>{time}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Reviews Section */}
          <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>User Reviews</Text>
              {reviews.length > 0 && <Text style={[styles.reviewCountLabel, { color: colors.pink }]}>{reviews.length}</Text>}
            </View>

            {reviews.length > 0 && (
              <RatingAnalysis
                reviews={reviews}
                totalRating={service.rating || 0}
                reviewCount={service.review_count || 0}
              />
            )}

            {/* Premium Rating Filter UI */}
            {reviews.length > 0 && (
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Filter by rating:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterContainer}
                >
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilterRating(null); }}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: filterRating === null ? colors.pink : 'transparent',
                        borderColor: filterRating === null ? colors.pink : colors.cardBorder
                      }
                    ]}
                  >
                    <Text style={[styles.filterText, { color: filterRating === null ? '#FFF' : colors.textPrimary }]}>All Reviews</Text>
                  </Pressable>
                  {[5, 4, 3, 2, 1].map(star => (
                    <Pressable
                      key={star}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilterRating(star); }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: filterRating === star ? colors.pink : 'transparent',
                          borderColor: filterRating === star ? colors.pink : colors.cardBorder
                        }
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={filterRating === star ? "star" : "star-outline"}
                        size={14}
                        color={filterRating === star ? '#FFF' : '#FFD700'}
                      />
                      <Text style={[styles.filterText, { color: filterRating === star ? '#FFF' : colors.textPrimary }]}>{star}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {filteredReviews.length > 0 ? (
              filteredReviews.map((review, idx) => (
                <View key={review.review_id || idx} style={[styles.reviewItem, { borderBottomColor: colors.cardBorder }]}>
                  <View style={styles.reviewTop}>
                    <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{review.user_name || 'Anonymous'}</Text>
                    <StarRating rating={review.rating || 0} size={12} readonly />
                  </View>
                  <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyReviews}>
                <MaterialCommunityIcons name="comment-text-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {filterRating ? `No ${filterRating}-star reviews yet.` : 'Be the first to review this service.'}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Spacer to ensure scrolling past bottom bar */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>



      {/* Premium Bottom Bar */}
      <View style={[styles.bottomBarContainer, { paddingBottom: insets.bottom + 15 }]}>
        <GlassView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.bottomBlur}>
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
        </GlassView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.6,
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  stickyHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
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
    zIndex: 110,
  },
  rightFloatingControls: { flexDirection: 'row' },
  floatingIconBtn: {
    width: 44, height: 44,
    borderRadius: 14,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  btnInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    zIndex: 10,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: HERO_HEIGHT * 0.4,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { height: 4, width: 4, borderRadius: 2 },

  contentWrapper: {
    paddingHorizontal: Spacing.lg,
    marginTop: -30,
    zIndex: 20,
  },
  mainInfoCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadows.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  locationText: { fontFamily: Fonts.bold, fontSize: 9 },

  serviceTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    lineHeight: 34,
    marginBottom: Spacing.sm,
    letterSpacing: -1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 8,
  },
  ratingValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    marginLeft: 4,
  },
  reviewCount: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    opacity: 0.6,
  },
  sectionHeadingSmall: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.sm,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  descriptionText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: 12,
  },
  providerIconWrap: {
    width: 38, height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerLabel: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 1 },
  providerName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: { fontFamily: Fonts.medium, fontSize: 10, opacity: 0.6 },
  statValue: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  section: { marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  sectionHeading: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
    letterSpacing: -0.5,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotText: { fontFamily: Fonts.bold, fontSize: 12 },

  reviewCountLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    backgroundColor: 'rgba(205, 66, 168, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reviewsSection: { marginTop: Spacing.xxl + 20 },
  reviewItem: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewerName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
  reviewComment: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.7, lineHeight: 20 },
  emptyReviews: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.5 },

  bottomBarContainer: {
    position: 'absolute',
    bottom: 15,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 100,
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
  priceInfo: { flex: 0.45 },
  priceTag: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  priceValue: { fontFamily: Fonts.extraBold, fontSize: 24, letterSpacing: -1 },
  currency: { fontFamily: Fonts.bold, fontSize: 12 },
  bookBtn: { flex: 0.55, height: 56 },
  bookBtnGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  bookBtnText: { color: '#FFF', fontFamily: Fonts.extraBold, fontSize: FontSizes.md },

  // Viewer Styles
  viewerOverlay: { flex: 1, backgroundColor: '#000' },
  viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, zIndex: 1000 },
  viewerCloseBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  viewerCounter: { color: '#FFF', fontFamily: Fonts.bold, fontSize: FontSizes.md },
  viewerImageWrapper: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.7 },
  filterSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.8,
  },
  filterContainer: {
    paddingVertical: 4,
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
});
