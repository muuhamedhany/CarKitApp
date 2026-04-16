import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useWishlist } from '@/contexts/WishlistContext';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = 340;

type ProductDetail = {
  product_id: number;
  name: string;
  description: string;
  price: string;
  stock: number;
  category_name: string;
  vendor_name: string;
  image_url: string | null;
  image_url_2: string | null;
  image_url_3: string | null;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { wishlist, toggleWishlist: contextToggleWishlist } = useWishlist();

  const isWishlisted = id ? !!wishlist[Number(id)] : false;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveImageIndex(viewableItems[0].index || 0);
    }
  }).current;

  useEffect(() => {
    fetchProduct();
  }, [id]);

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
    const result = await addToCart(product.product_id);
    if (result.success) {
      showToast('success', 'Added to Cart', `${product.name} added to your cart.`);
    } else {
      showToast('error', 'Error', result.message);
    }
  };

  const handleToggleWishlist = () => {
    if (!id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    contextToggleWishlist(Number(id));
  };

  const handleImagePress = (images: string[], index: number) => {
    router.push({
      pathname: '/image-viewer',
      params: {
        images: JSON.stringify(images),
        initialIndex: String(index),
      },
    } as any);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  if (!product) return null;

  const images: string[] = [];
  if (product.image_url) images.push(product.image_url);
  if (product.image_url_2) images.push(product.image_url_2);
  if (product.image_url_3) images.push(product.image_url_3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Floating Header — overlaid on image */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFFFFF" />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={handleToggleWishlist} style={[styles.iconBtn, { marginRight: 4 }]}>
            <MaterialCommunityIcons
              name={isWishlisted ? 'cards-heart' : 'cards-heart-outline'}
              size={26}
              color={isWishlisted ? colors.pink : '#FFFFFF'}
            />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/cart')} style={styles.iconBtn}>
            <MaterialCommunityIcons name="cart-outline" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
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
                <Pressable
                  onPress={() => handleImagePress(images, index)}
                  style={styles.imageWrapper}
                >
                  <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
                </Pressable>
              )}
            />
          ) : (
            <View style={[styles.imageWrapper, styles.center]}>
              <MaterialCommunityIcons name="car-cog" size={80} color="rgba(255,255,255,0.3)" />
            </View>
          )}



        </View>

        {/* Pill Pagination Dots */}
        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeImageIndex
                    ? [styles.dotActive, { backgroundColor: colors.pink }]
                    : { backgroundColor: colors.textMuted },
                ]}
              />
            ))}
          </View>
        )}

        {/* Content Section */}
        <View style={styles.content}>

          {/* Title + Vendor */}
          <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
          {product.vendor_name && (
            <Text style={[styles.vendorLine, { color: colors.pink }]}>
              By {product.vendor_name}
            </Text>
          )}

          {/* Badges */}
          <View style={styles.badgesRow}>
            {product.category_name && (
              <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="tag-outline" size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{product.category_name}</Text>
              </View>
            )}
            <View style={[
              styles.badge,
              {
                backgroundColor: product.stock > 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 71, 87, 0.15)',
                borderColor: colors.cardBorder,
              },
            ]}>
              <MaterialCommunityIcons
                name={product.stock > 0 ? 'check-circle' : 'close-circle'}
                size={13}
                color={product.stock > 0 ? colors.success : colors.error}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.badgeText, { color: product.stock > 0 ? colors.success : colors.error }]}>
                {product.stock > 0 ? 'Available' : 'Not Available'}
              </Text>
            </View>
          </View>

          {/* Description Card */}
          <View style={[styles.descriptionCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {product.description || 'No description available for this product.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: colors.background, borderTopColor: colors.dividerLine }]}>
        <View style={styles.priceBlock}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Price</Text>
          <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{product.price} EGP</Text>
        </View>
        <Pressable
          onPress={handleAddToCart}
          disabled={product.stock <= 0}
          style={({ pressed }) => [{ flex: 1, opacity: pressed || product.stock <= 0 ? 0.7 : 1 }]}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>Add to Cart</Text>
            <MaterialCommunityIcons name="cart-plus" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },

  // Floating header overlaid on image
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Image Gallery
  galleryContainer: {
    width: SCREEN_WIDTH - 40,
    height: IMAGE_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    marginTop: 105,
    marginHorizontal: 20
  },
  imageWrapper: {
  },
  image: {
    width: SCREEN_WIDTH - 40,
    height: IMAGE_HEIGHT,
    borderRadius: BorderRadius.xl,
    paddingRight: 1
  },
  pagination: {
    flexDirection: 'row',
    bottom: Spacing.md,
    alignSelf: 'center',
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },

  // Content
  content: {
    paddingHorizontal: Spacing.lg,
  },
  productName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
  },
  vendorLine: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  descriptionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  priceBlock: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  priceValue: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  actionBtnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: '#FFFFFF',
  },
});
