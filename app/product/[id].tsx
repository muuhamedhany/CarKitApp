import { useEffect, useRef, useState, useMemo } from 'react';
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
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useWishlist } from '@/contexts/WishlistContext';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { ProductDetailSkeleton } from '@/components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_WIDTH * 1.1;

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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { wishlist, toggleWishlist: contextToggleWishlist } = useWishlist();

  const scrollY = useRef(new Animated.Value(0)).current;
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await addToCart(product.product_id);
    if (result.success) {
      showToast('success', 'Added to Cart', `${product.name} added to your cart.`);
    } else {
      showToast('error', 'Error', result.message);
    }
  };

  const handleToggleWishlist = () => {
    if (!id) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    contextToggleWishlist(Number(id));
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) return null;

  const images = [product.image_url, product.image_url_2, product.image_url_3].filter(Boolean) as string[];

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
           <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.textPrimary }]}>{product.name}</Text>
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
          <Pressable onPress={handleToggleWishlist} style={styles.floatingIconBtn}>
            <BlurView intensity={40} tint="dark" style={styles.blurWrap}>
              <MaterialCommunityIcons
                name={isWishlisted ? 'cards-heart' : 'cards-heart-outline'}
                size={22}
                color={isWishlisted ? colors.pink : '#FFF'}
              />
            </BlurView>
          </Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/(tabs)/cart'); }} style={[styles.floatingIconBtn, { marginLeft: 10 }]}>
            <BlurView intensity={40} tint="dark" style={styles.blurWrap}>
              <MaterialCommunityIcons name="cart-outline" size={22} color="#FFF" />
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
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
              renderItem={({ item }) => (
                <Image source={{ uri: item }} style={styles.heroImage} resizeMode="cover" />
              )}
            />
          ) : (
            <View style={[styles.heroImage, styles.center, { backgroundColor: colors.backgroundSecondary }]}>
              <MaterialCommunityIcons name="car-cog" size={80} color={colors.textMuted} />
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

        {/* Product Info Content */}
        <View style={styles.mainContent}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
               <Text style={[styles.categoryText, { color: colors.pink }]}>{product.category_name?.toUpperCase() || 'GENERAL'}</Text>
               <Text style={[styles.productTitle, { color: colors.textPrimary }]}>{product.name}</Text>
            </View>
            <View style={[styles.stockBadge, { backgroundColor: product.stock > 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 71, 87, 0.1)' }]}>
               <Text style={[styles.stockText, { color: product.stock > 0 ? colors.success : colors.error }]}>
                 {product.stock > 0 ? 'IN STOCK' : 'OUT OF STOCK'}
               </Text>
            </View>
          </View>

          <View style={[styles.vendorCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
             <View style={[styles.vendorAvatar, { backgroundColor: colors.background }]}>
                <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.pink} />
             </View>
             <View style={{ flex: 1 }}>
                <Text style={[styles.vendorLabel, { color: colors.textSecondary }]}>Vendor</Text>
                <Text style={[styles.vendorName, { color: colors.textPrimary }]}>{product.vendor_name || 'Official Store'}</Text>
             </View>
             <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </View>

          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>About Product</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {product.description || 'No detailed description available for this item.'}
          </Text>

          {/* Quick Specs / Features can go here */}
          <View style={styles.featuresGrid}>
             <View style={[styles.featureItem, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.pink} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>Authentic</Text>
             </View>
             <View style={[styles.featureItem, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={22} color={colors.pink} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>Fast Shipping</Text>
             </View>
             <View style={[styles.featureItem, { backgroundColor: colors.backgroundSecondary }]}>
                <MaterialCommunityIcons name="keyboard-return" size={22} color={colors.pink} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>7 Days Return</Text>
             </View>
          </View>
        </View>
      </Animated.ScrollView>

      {/* Glassmorphic Bottom Action Bar */}
      <View style={[styles.bottomBarContainer, { paddingBottom: insets.bottom + 10 }]}>
         <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.bottomBlur}>
            <View style={styles.bottomBarContent}>
               <View style={styles.priceInfo}>
                  <Text style={[styles.priceTag, { color: colors.textSecondary }]}>Total Price</Text>
                  <View style={styles.priceRow}>
                     <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{product.price}</Text>
                     <Text style={[styles.currency, { color: colors.pink }]}> EGP</Text>
                  </View>
               </View>
               
               <Pressable
                 onPress={handleAddToCart}
                 disabled={product.stock <= 0}
                 style={({ pressed }) => [
                   styles.addBtn,
                   { opacity: product.stock <= 0 ? 0.5 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  categoryText: {
    fontFamily: Fonts.extraBold,
    fontSize: 10,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  productTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xxl,
    lineHeight: 32,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontFamily: Fonts.bold,
    fontSize: 9,
  },

  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  vendorAvatar: {
    width: 40, height: 40,
    borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  vendorLabel: { fontFamily: Fonts.medium, fontSize: 10, marginBottom: 2 },
  vendorName: { fontFamily: Fonts.bold, fontSize: FontSizes.md },

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

  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  featureItem: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
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
  
  addBtn: {
    flex: 0.55,
    height: 56,
  },
  addBtnGradient: {
    flex: 1,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
  },
});

