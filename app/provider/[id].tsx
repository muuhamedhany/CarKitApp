import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useRef,
  useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, GlassView, ServiceCard, StarRating, RatingAnalysis } from '@/components';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { providerService } from '@/services/api/provider.service';
import { reviewService } from '@/services/api/review.service';
import { ProviderPublicProfile, Review } from '@/types/api.types';
import Text from '@/components/common/LocalizedText';

const { width } = Dimensions.get('window');

export default function ProviderPublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [provider, setProvider] = useState<ProviderPublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const [reviewsY, setReviewsY] = useState(0);

  const scrollToReviews = () => {
    if (reviewsY > 0) {
      scrollRef.current?.scrollTo({ y: reviewsY - 20, animated: true });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const fetchProviderProfile = useCallback(async () => {
    if (!id || id === 'undefined' || isNaN(Number(id))) return;

    try {
      setLoading(true);
      const profileRes = await providerService.getProviderById(Number(id));

      if (profileRes.success && profileRes.data) {
        setProvider(profileRes.data);
        try {
          const reviewsRes = await reviewService.getProviderReviews(Number(id));
          if (reviewsRes.success && reviewsRes.data) {
            setReviews(reviewsRes.data);
          }
        } catch (revErr) {
          console.log('[ProviderProfile] Failed to fetch reviews:', revErr);
        }
      } else {
        showToast('error', 'Error', 'Provider profile not found.');
        router.back();
      }
    } catch (error) {
      showToast('error', 'Error', 'Failed to fetch provider details.');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchProviderProfile();
  }, [fetchProviderProfile]);

  const filteredReviews = filterRating 
    ? reviews.filter(r => Math.round(r.rating || 0) === filterRating)
    : reviews;

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  if (!provider) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.purple + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.pink + '10' }]} />

      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <BackButton />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Hero Section */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.heroSection}>
          <View style={[styles.avatarGlow, { shadowColor: colors.purple }]}>
            <LinearGradient
              colors={[colors.purple, colors.pink]}
              style={styles.avatarGradient}
            >
              <MaterialCommunityIcons name="account-cog" size={48} color="#FFF" />
            </LinearGradient>
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#FFF" />
            </View>
          </View>

          <Text 
            style={[styles.providerName, { color: colors.textPrimary }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {provider.name}
          </Text>
          
          <View style={styles.badgeRow}>
            <View style={[styles.typeBadge, { backgroundColor: colors.purple + '15' }]}>
              <Text style={[styles.typeText, { color: colors.purple }]}>EXPERT SERVICE PROVIDER</Text>
            </View>
          </View>

          {/* Stats Bar */}
          <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.statsBar}>
            <Pressable onPress={scrollToReviews} style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {provider.rating ? Number(provider.rating).toFixed(1) : '--'}
              </Text>
              <View style={styles.statLabelRow}>
                <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rating</Text>
              </View>
            </Pressable>
            <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{provider.review_count || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{provider.services?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Services</Text>
            </View>
          </GlassView>
        </Animated.View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          {/* About Section */}
          {provider.contact_info && (
            <Animated.View entering={FadeInUp.delay(200)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="map-marker-radius-outline" size={20} color={colors.purple} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Location & Contact</Text>
              </View>
              <GlassView intensity={isDark ? 10 : 20} style={styles.infoCard}>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{provider.contact_info}</Text>
              </GlassView>
            </Animated.View>
          )}

          {/* Services Section */}
          <Animated.View entering={FadeInUp.delay(400)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="car-wrench" size={20} color={colors.purple} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Available Services</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.purple + '20' }]}>
                <Text style={[styles.countText, { color: colors.purple }]}>{provider.services?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.servicesList}>
              {provider.services?.map((service, idx) => (
                <Animated.View
                  key={`svc-${service.service_id}`}
                  entering={FadeInUp.delay(500 + idx * 100).duration(600)}
                >
                  <ServiceCard
                    name={service.name}
                    price={service.price || 0}
                    imageUrl={service.image_url}
                    duration={service.duration || 0}
                    rating={service.rating}
                    reviewCount={service.review_count}
                    onView={() => router.push(`/service/${service.service_id}`)}
                    onBookNow={() => router.push(`/service/${service.service_id}`)}
                  />
                </Animated.View>
              ))}
            </View>

            {(!provider.services || provider.services.length === 0) && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="tools" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No services listed yet.</Text>
              </View>
            )}
          </Animated.View>

          {/* Reviews Section */}
          <Animated.View 
            onLayout={(e) => setReviewsY(e.nativeEvent.layout.y)}
            entering={FadeInUp.delay(600)} 
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="comment-check-outline" size={20} color={colors.purple} />
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Client Experience</Text>
            </View>
            
            {reviews.length > 0 ? (
              <>
                <RatingAnalysis 
                  reviews={reviews} 
                  totalRating={provider.rating || 0} 
                  reviewCount={provider.review_count || 0} 
                />

                {/* Filter UI */}
                <View style={styles.filterSection}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <Pressable 
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilterRating(null); }}
                      style={[
                        styles.filterChip, 
                        { backgroundColor: filterRating === null ? colors.purple : 'transparent', borderColor: filterRating === null ? colors.purple : colors.cardBorder }
                      ]}
                    >
                      <Text style={[styles.filterText, { color: filterRating === null ? '#FFF' : colors.textPrimary }]}>All Feedbacks</Text>
                    </Pressable>
                    {[5, 4, 3, 2, 1].map(star => (
                      <Pressable 
                        key={`filter-${star}`}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilterRating(star); }}
                        style={[
                          styles.filterChip, 
                          { backgroundColor: filterRating === star ? colors.purple : 'transparent', borderColor: filterRating === star ? colors.purple : colors.cardBorder }
                        ]}
                      >
                        <MaterialCommunityIcons name={filterRating === star ? "star" : "star-outline"} size={14} color={filterRating === star ? '#FFF' : '#FFD700'} />
                        <Text style={[styles.filterText, { color: filterRating === star ? '#FFF' : colors.textPrimary }]}>{star}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {filteredReviews.map((review, idx) => (
                  <GlassView
                    key={`rev-${review.review_id || 'no-id'}-${idx}`}
                    intensity={15}
                    style={[styles.reviewCard, { borderColor: colors.cardBorder }]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{review.user_name || 'Anonymous'}</Text>
                        <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                          {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                        </Text>
                      </View>
                      <StarRating rating={review.rating || 0} size={12} readonly />
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                  </GlassView>
                ))}

                {filteredReviews.length === 0 && (
                  <View style={styles.emptyReviews}>
                    <MaterialCommunityIcons name="comment-remove-outline" size={32} color={colors.textMuted} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No {filterRating}-star reviews yet.</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.emptyReviews}>
                <MaterialCommunityIcons name="comment-outline" size={32} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No reviews yet.</Text>
              </View>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  headerContainer: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 100,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: Spacing.xl,
  },
  avatarGlow: {
    width: 110,
    height: 110,
    borderRadius: BorderRadius.xl,
    ...Shadows.lg,
    elevation: 10,
    marginBottom: 20,
    position: 'relative',
  },
  avatarGradient: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  providerName: {
    fontFamily: Fonts.extraBold,
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  badgeRow: {
    marginBottom: 24,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  statsBar: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: Fonts.extraBold,
    fontSize: 22,
    marginBottom: 2,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  statDivider: {
    width: 1,
    height: 30,
    opacity: 0.1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
  },
  infoCard: {
    padding: Spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  infoText: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 22,
  },
  servicesList: {
    gap: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterScroll: {
    gap: 10,
    paddingVertical: 5,
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
    fontSize: 12,
  },
  reviewCard: {
    padding: Spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reviewerName: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  reviewDate: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 2,
  },
  reviewComment: {
    fontFamily: Fonts.medium,
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    opacity: 0.5,
  },
});
