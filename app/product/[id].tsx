import { useWishlist } from '@/contexts/WishlistContext';
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
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView, ProductDetailSkeleton, RatingAnalysis, StarRating } from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { reviewService } from '@/services/api/review.service';
import { Review } from '@/types/api.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.55;

type ProductDetail = {
  product_id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  category_name: string;
  vendor_name: string;
  vendor_id_fk?: number;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
  rating?: number;
  review_count?: number;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const { wishlist, toggleWishlist: contextToggleWishlist } = useWishlist();

  const scrollY = useSharedValue(0);
  const isWishlisted = id ? !!wishlist[Number(id)] : false;

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    if (!id) return;
    try {
      const resp = await reviewService.getProductReviews(Number(id));
      if (resp.success) {
        setReviews(resp.data || []);
      }
    } catch (err) {
      console.log('Error fetching product reviews:', err);
    }
  };

  const fetchProduct = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(`${API_URL}/products/${id}`, { headers });
      const data = await response.json();
      if (data.success) {
        setProduct(data.data);
      } else {
        showToast('error', 'Error', 'Product not found');
        router.back();
      }
    } catch {
      showToast('error', 'Error', 'Failed to fetch product details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    // Check if we already have this product in cart and if it reaches stock
    const itemInCart = cartItems.find(i => i.product_id_fk === product.product_id);
    const totalQuantity = (itemInCart?.quantity || 0) + quantity;

    if (totalQuantity > product.stock) {
      showToast('warning', 'Limit Reached', `Only ${product.stock} units available in total.`);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await addToCart(product.product_id, quantity);
    if (result.success) {
      showToast('success', 'Added!', `${quantity} x ${product.name} added to cart.`);
    } else {
      showToast('error', 'Error', result.message);
    }
  };

  const handleToggleWishlist = () => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    contextToggleWishlist(Number(id));
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

  if (loading) return <ProductDetailSkeleton />;
  if (!product) return null;

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[];

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
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>{product.name}</Text>
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
            <Pressable onPress={handleToggleWishlist} style={styles.btnInner}>
              <MaterialCommunityIcons
                name={isWishlisted ? 'cards-heart' : 'cards-heart-outline'}
                size={22}
                color={isWishlisted ? colors.pink : (isDark ? '#FFF' : '#000')}
              />
            </Pressable>
          </Animated.View>
          <Animated.View style={[styles.floatingIconBtn, backBtnStyle, { marginLeft: 10 }]}>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/cart'); }} style={styles.btnInner}>
              <MaterialCommunityIcons name="cart-outline" size={22} color={isDark ? '#FFF' : '#000'} />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 200 }}
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
              renderItem={({ item, index }) => (
                <Pressable onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsViewerVisible(true);
                }}>
                  <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
                </Pressable>
              )}
            />
          ) : (
            <View style={[styles.heroImage, styles.center, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialCommunityIcons name="car-cog" size={80} color={colors.textMuted} />
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
                  <Text style={[styles.categoryText, { color: colors.pink }]}>{product.category_name?.toUpperCase() || 'GENERAL'}</Text>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: product.stock > 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 71, 87, 0.1)' }]}>
                  <View style={[styles.stockDot, { backgroundColor: product.stock > 0 ? colors.success : colors.error }]} />
                  <Text style={[styles.stockText, { color: product.stock > 0 ? colors.success : colors.error }]}>
                    {product.stock > 0 ? `${product.stock} IN STOCK` : 'OUT OF STOCK'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.productTitle, { color: colors.textPrimary }]}>{product.name}</Text>

              {product.rating !== undefined && (
                <View style={styles.ratingRow}>
                  <StarRating rating={product.rating} size={16} readonly />
                  <Text style={[styles.ratingValue, { color: colors.textPrimary }]}>
                    {Number(product.rating).toFixed(1)}
                  </Text>
                  <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                    ({product.review_count || 0} reviews)
                  </Text>
                </View>
              )}

              <Text style={[styles.sectionHeadingSmall, { color: colors.textPrimary }]}>Description</Text>
              <Text style={[styles.inlineDescription, { color: colors.textSecondary }]}>
                {product.description || 'Premium automotive part designed for maximum performance and durability.'}
              </Text>

              <Pressable
                style={[styles.vendorRow, { borderTopColor: colors.cardBorder }]}
                onPress={() => product.vendor_id_fk && router.push(`/vendor/${product.vendor_id_fk}`)}
              >
                <View style={[styles.vendorIconWrap, { backgroundColor: colors.backgroundSecondary }]}>
                  <MaterialCommunityIcons name="storefront-outline" size={18} color={colors.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vendorLabel, { color: colors.textSecondary }]}>Sold by</Text>
                  <Text style={[styles.vendorName, { color: colors.textPrimary }]}>{product.vendor_name || 'Official Store'}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
              </Pressable>
            </GlassView>
          </Animated.View>

          {/* Features Grid */}
          <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.featuresGrid}>
            {[
              { icon: 'shield-check', label: 'Authentic' },
              { icon: 'truck-fast', label: 'Express' },
              { icon: 'refresh', label: 'Easy Returns' },
            ].map((item, i) => (
              <View key={i} style={[styles.featureItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.pink} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>

          {/* Reviews Section */}
          <Animated.View entering={FadeInUp.delay(600).springify()} style={styles.reviewsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>User Reviews</Text>
              {reviews.length > 0 && <Text style={[styles.reviewCountLabel, { color: colors.pink }]}>{reviews.length}</Text>}
            </View>

            {reviews.length > 0 && (
              <RatingAnalysis
                reviews={reviews}
                totalRating={product.rating || 0}
                reviewCount={product.review_count || 0}
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
                  {filterRating ? `No ${filterRating}-star reviews yet.` : 'Be the first to review this product.'}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Spacer to ensure scrolling past bottom bar */}
          <View style={{ height: 100 }} />
        </View>
      </Animated.ScrollView>

      {/* Full Screen Image Viewer Modal */}
      {isViewerVisible && (
        <Animated.View entering={FadeInDown.duration(300)} style={StyleSheet.absoluteFill}>
          <View style={styles.viewerOverlay}>
            <GlassView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />

            <View style={[styles.viewerHeader, { paddingTop: insets.top + 10 }]}>
              <Pressable
                onPress={() => setIsViewerVisible(false)}
                style={styles.viewerCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={28} color="#FFF" />
              </Pressable>
              <Text style={styles.viewerCounter}>
                {activeImageIndex + 1} / {images.length}
              </Text>
              <View style={{ width: 44 }} />
            </View>

            <FlatList
              data={images}
              horizontal
              pagingEnabled
              initialScrollIndex={activeImageIndex}
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
              renderItem={({ item }) => (
                <View style={styles.viewerImageWrapper}>
                  <Image
                    source={{ uri: item }}
                    style={styles.viewerImage}
                    resizeMode="contain"
                  />
                </View>
              )}
              keyExtractor={(_, i) => i.toString()}
            />
          </View>
        </Animated.View>
      )}

      {/* Premium Bottom Bar */}
      <View style={[styles.bottomBarContainer, { paddingBottom: insets.bottom + 15 }]}>
        <GlassView intensity={50} tint={isDark ? 'dark' : 'light'} style={styles.bottomBlur}>
          <View style={styles.bottomBarContent}>
            <View style={styles.qtyPriceWrapper}>
              <View style={[styles.qtySelector, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <Pressable onPress={() => setQuantity(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
                  <MaterialCommunityIcons name="minus" size={16} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.qtyValue, { color: colors.textPrimary }]}>{quantity}</Text>
                <Pressable onPress={() => setQuantity(q => Math.min(product.stock, q + 1))} style={styles.qtyBtn}>
                  <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
                </Pressable>
              </View>
              <View style={styles.priceContainer}>
                <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                  {(Number(product.price) * quantity).toLocaleString()}
                </Text>
                <Text style={[styles.currency, { color: colors.pink }]}> EGP</Text>
              </View>
            </View>

            <Pressable
              onPress={handleAddToCart}
              disabled={product.stock <= 0}
              style={({ pressed }) => [
                styles.addBtn,
                { opacity: product.stock <= 0 ? 0.5 : 1 }
              ]}
            >
              <LinearGradient
                colors={[colors.pink, colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.addBtnGradient}
              >
                <MaterialCommunityIcons name="cart-variant" size={20} color="#FFF" />
                <Text style={styles.addBtnText}>Add to Cart</Text>
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
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontFamily: Fonts.bold, fontSize: 9 },

  productTitle: {
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
  inlineDescription: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    opacity: 0.8,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: 12,
  },
  vendorIconWrap: {
    width: 38, height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorLabel: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 1 },
  vendorName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  section: { marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: Spacing.md },
  sectionHeading: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
    letterSpacing: -0.5,
  },
  reviewCountLabel: {
    fontFamily: Fonts.bold,
    fontSize: 12,
    backgroundColor: 'rgba(205, 66, 168, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  descriptionText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    lineHeight: 22,
    opacity: 0.8,
  },
  featuresGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  featureItem: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    gap: 6,
  },
  featureText: { fontFamily: Fonts.bold, fontSize: 10 },

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
    padding: Spacing.md,
    gap: 12,
  },
  qtyPriceWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 4,
  },
  qtyBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  qtyValue: { fontFamily: Fonts.bold, fontSize: FontSizes.md, minWidth: 30, textAlign: 'center' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  priceValue: { fontFamily: Fonts.extraBold, fontSize: 24, letterSpacing: -1 },
  currency: { fontFamily: Fonts.bold, fontSize: 12 },
  addBtn: { height: 56 },
  addBtnGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: { color: '#FFF', fontFamily: Fonts.extraBold, fontSize: FontSizes.md },

  // Viewer Styles
  viewerOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  viewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    zIndex: 1000,
  },
  viewerCloseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCounter: {
    color: '#FFF',
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  viewerImageWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
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
