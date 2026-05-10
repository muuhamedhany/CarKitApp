import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton, GlassView, ServiceCard, StarRating } from '@/components';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { providerService } from '@/services/api/provider.service';
import { reviewService } from '@/services/api/review.service';
import { ProviderPublicProfile, Review } from '@/types/api.types';

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

  const fetchProviderProfile = useCallback(async () => {
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      console.log('[ProviderProfile] Invalid or missing ID:', id);
      return;
    }

    try {
      setLoading(true);
      console.log('[ProviderProfile] Fetching profile for ID:', id);

      // Fetch profile first
      const profileRes = await providerService.getProviderById(Number(id));

      if (profileRes.success && profileRes.data) {
        setProvider(profileRes.data);

        // Fetch reviews separately
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
      console.error('[ProviderProfile] Error fetching details:', error);
      showToast('error', 'Error', 'Failed to fetch provider details.');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchProviderProfile();
  }, [fetchProviderProfile]);

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
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCover}>
          <LinearGradient
            colors={[colors.purple + '30', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.backButtonContainer, { top: insets.top + 10 }]}>
            <BackButton />
          </View>
        </View>

        <View style={styles.profileSection}>
          <Animated.View entering={FadeInDown.duration(800)}>
            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.profileCard, { borderColor: colors.cardBorder }]}>
              <View style={[styles.avatar, { backgroundColor: colors.purple + '20' }]}>
                <MaterialCommunityIcons name="shield-star-outline" size={40} color={colors.purple} />
              </View>
              <View style={styles.providerInfo}>
                <Text style={[styles.providerName, { color: colors.textPrimary }]}>{provider.name}</Text>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={16} color="#FBBF24" />
                  <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                    {provider.rating ? Number(provider.rating).toFixed(1) : 'No ratings'}
                  </Text>
                  {provider.review_count ? (
                    <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                      ({provider.review_count} reviews)
                    </Text>
                  ) : null}
                </View>
                {provider.verification_status === 'verified' && (
                  <View style={styles.verifiedBadge}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#10B981" />
                    <Text style={[styles.verifiedText, { color: '#10B981' }]}>Verified Provider</Text>
                  </View>
                )}
              </View>
            </GlassView>
          </Animated.View>

          {provider.contact_info && (
            <Animated.View entering={FadeInDown.delay(200).duration(800)}>
              <GlassView intensity={isDark ? 15 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.infoBox, { borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.purple} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{provider.contact_info}</Text>
              </GlassView>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Our Services</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.purple + '20' }]}>
                <Text style={[styles.countText, { color: colors.purple }]}>{provider.services?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.servicesList}>
              {provider.services?.map((service, idx) => (
                <Animated.View
                  key={service.service_id}
                  entering={FadeInUp.delay(500 + idx * 100).duration(600)}
                  style={styles.serviceItem}
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

          <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.reviewsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: Spacing.md }]}>Reviews</Text>
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <GlassView
                  key={review.review_id || idx}
                  intensity={isDark ? 10 : 20}
                  tint={isDark ? 'dark' : 'light'}
                  style={[styles.reviewItem, { borderColor: colors.cardBorder }]}
                >
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{review.customer_name || 'Anonymous'}</Text>
                    <StarRating rating={review.rating || 0} size={14} readonly />
                  </View>
                  <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.comment}</Text>
                  <Text style={[styles.reviewDate, { color: colors.textMuted }]}>
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                  </Text>
                </GlassView>
              ))
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
  headerCover: {
    height: 180,
    width: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 10,
  },
  profileSection: {
    paddingHorizontal: Spacing.md,
    marginTop: -60,
  },
  profileCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  providerInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  providerName: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xl,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  reviewCount: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    opacity: 0.7,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
  },
  infoBox: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  servicesSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  servicesList: {
    gap: Spacing.md,
  },
  serviceItem: {
    marginBottom: Spacing.sm,
  },
  reviewsSection: {
    marginTop: Spacing.md,
  },
  reviewItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  reviewComment: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    textAlign: 'right',
  },
  emptyReviews: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
  },
});
