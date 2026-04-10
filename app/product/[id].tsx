import { useEffect, useState, useRef } from 'react';
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

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    } catch (error) {
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

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  if (!product) return null;

  // Aggregate images
  const images = [];
  if (product.image_url) images.push(product.image_url);
  if (product.image_url_2) images.push(product.image_url_2);
  if (product.image_url_3) images.push(product.image_url_3);


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={colors.textPrimary} />
        </Pressable>
        <Pressable onPress={() => router.push('/(tabs)/cart')} style={styles.iconBtn}>
          <MaterialCommunityIcons name="cart-outline" size={28} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Image Carousel */}
        <View style={[styles.carouselContainer, { backgroundColor: colors.backgroundSecondary }]}>
          {images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              renderItem={({ item }) => (
                <View style={[styles.imageWrapper, { width: SCREEN_WIDTH }]}>
                   <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
                </View>
              )}
            />
          ) : (
            <View style={[styles.imageWrapper, styles.center, { width: SCREEN_WIDTH }]}>
              <MaterialCommunityIcons name="car-cog" size={80} color={colors.textMuted} />
            </View>
          )}

          {/* Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === activeImageIndex ? colors.pink : colors.cardBorder },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={styles.titleWrapper}>
              <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
            </View>
            <Text style={[styles.price, { color: colors.pink }]}>{product.price} EGP</Text>
          </View>

          <View style={styles.badgesRow}>
            {product.category_name && (
              <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{product.category_name}</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: product.stock > 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(255, 71, 87, 0.15)', borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons 
                name={product.stock > 0 ? "check-circle" : "close-circle"} 
                size={14} 
                color={product.stock > 0 ? colors.success : colors.error} 
                style={{ marginRight: 4 }} 
              />
              <Text style={[styles.badgeText, { color: product.stock > 0 ? colors.success : colors.error }]}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
            {product.vendor_name && (
              <View style={[styles.badge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="storefront-outline" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{product.vendor_name}</Text>
              </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description || 'No description available for this product.'}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: colors.background }]}>
        <Pressable 
          onPress={handleAddToCart} 
          disabled={product.stock <= 0}
          style={({ pressed }) => [
            { flex: 1, opacity: pressed || product.stock <= 0 ? 0.7 : 1 }
          ]}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>Add To Cart</Text>
            <MaterialCommunityIcons name="cart-plus" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    zIndex: 10, // above the carousel
  },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    height: 350,
    width: SCREEN_WIDTH,
    marginBottom: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  imageWrapper: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  titleWrapper: {
    flex: 1,
    marginRight: Spacing.md,
  },
  productName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    lineHeight: 30,
  },
  price: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  badgeText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: 22,
    opacity: 0.9,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    borderRadius: BorderRadius.full,
  },
  actionBtnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    color: '#FFFFFF',
    marginRight: Spacing.sm,
  },
});
