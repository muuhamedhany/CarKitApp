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

import { BackButton, GlassView, ProductCard, StarRating } from '@/components';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { reviewService } from '@/services/api/review.service';
import { vendorService } from '@/services/api/vendor.service';
import { Review, VendorPublicProfile } from '@/types/api.types';

const { width } = Dimensions.get('window');

export default function VendorPublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [vendor, setVendor] = useState<VendorPublicProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendorProfile = useCallback(async () => {
    if (!id || id === 'undefined' || isNaN(Number(id))) {
      console.log('[VendorProfile] Invalid or missing ID:', id);
      return;
    }

    try {
      setLoading(true);
      console.log('[VendorProfile] Fetching profile for ID:', id);

      // Fetch profile first
      const profileRes = await vendorService.getVendorById(Number(id));

      if (profileRes.success && profileRes.data) {
        setVendor(profileRes.data);

        // Fetch reviews separately so failures don't block the profile
        try {
          const reviewsRes = await reviewService.getVendorReviews(Number(id));
          if (reviewsRes.success && reviewsRes.data) {
            setReviews(reviewsRes.data);
          }
        } catch (revErr) {
          console.log('[VendorProfile] Failed to fetch reviews:', revErr);
        }
      } else {
        showToast('error', 'Error', 'Vendor profile not found.');
        router.back();
      }
    } catch (error) {
      console.error('[VendorProfile] Error fetching details:', error);
      showToast('error', 'Error', 'Failed to fetch vendor details.');
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchVendorProfile();
  }, [fetchVendorProfile]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  if (!vendor) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <View style={[styles.backButtonContainer]}>
        <BackButton />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >


        <View style={styles.profileSection}>
          <Animated.View entering={FadeInDown.duration(800)}>
            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.profileCard, { borderColor: colors.cardBorder }]}>
              <View style={[styles.avatar, { backgroundColor: colors.pinkGlow }]}>
                <Text style={[styles.avatarText, { color: colors.pink }]}>
                  {(vendor.name || 'V').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.vendorInfo}>
                <Text style={[styles.vendorName, { color: colors.textPrimary }]}>{vendor.name}</Text>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={16} color="#FBBF24" />
                  <Text style={[styles.ratingText, { color: colors.textPrimary }]}>
                    {vendor.rating ? Number(vendor.rating).toFixed(1) : 'No ratings'}
                  </Text>
                  {vendor.review_count ? (
                    <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                      ({vendor.review_count} reviews)
                    </Text>
                  ) : null}
                </View>

                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="shield-check" size={14} color={colors.success} />
                  <Text style={[styles.verifiedText, { color: colors.success }]}>Verified Vendor</Text>
                </View>

              </View>
            </GlassView>
          </Animated.View>

          {vendor.contact_info && (
            <Animated.View entering={FadeInDown.delay(200).duration(800)}>
              <GlassView intensity={isDark ? 15 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.infoBox, { borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="information-outline" size={20} color={colors.pink} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{vendor.contact_info}</Text>
              </GlassView>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>All Products</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.pink + '20' }]}>
                <Text style={[styles.countText, { color: colors.pink }]}>{vendor.products?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.productGrid}>
              {vendor.products?.map((product) => (
                <View key={product.product_id} style={styles.productItem}>
                  <ProductCard
                    productId={product.product_id}
                    name={product.name}
                    price={product.price}
                    imageUrl={product.image_url}
                    rating={product.rating}
                    reviewCount={product.review_count}
                    onPress={() => router.push(`/product/${product.product_id}`)}
                  />
                </View>
              ))}
            </View>

            {(!vendor.products || vendor.products.length === 0) && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products listed yet.</Text>
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
                    <Text style={[styles.reviewerName, { color: colors.textPrimary }]}>{review.user_name || 'Anonymous'}</Text>
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
    height: 150,
    width: '100%',
  },
  backButtonContainer: {
    position: 'absolute',
    zIndex: 10,
  },
  profileSection: {
    paddingHorizontal: Spacing.md,
    marginTop: 110,
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
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  avatarText: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
  },
  vendorInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  vendorName: {
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
    paddingVertical: 4,
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
  productsSection: {
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
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  productItem: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
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
