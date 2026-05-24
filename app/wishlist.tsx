import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useMemo,
  useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { CenteredHeader, GlassView } from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius, Fonts, FontSizes, Spacing } from '@/constants/theme';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useTheme } from '@/hooks/useTheme';
import Text from '@/components/common/LocalizedText';

type WishlistProduct = {
  product_id: number;
  name: string;
  price: string;
  image_url: string | null;
  vendor_name: string;
  category_name: string;
  stock: number;
};

export default function WishlistScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { wishlist, toggleWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const wishlistIds = useMemo(
    () => Object.entries(wishlist)
      .filter(([, isWishlisted]) => isWishlisted)
      .map(([id]) => Number(id)),
    [wishlist]
  );

  const fetchWishlistProducts = useCallback(async () => {
    try {
      if (wishlistIds.length === 0) {
        setProducts([]);
        return;
      }

      const idsParam = wishlistIds.join(',');
      const res = await fetch(`${API_URL}/products?product_ids=${idsParam}`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching wishlist products:', error);
    }
  }, [wishlistIds]);

  useEffect(() => {
    setLoading(true);
    fetchWishlistProducts().finally(() => setLoading(false));
  }, [fetchWishlistProducts]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshWishlist();
    await fetchWishlistProducts();
    setRefreshing(false);
  };

  const handleRemove = async (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleWishlist(productId);
    setProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const handleAddToCart = async (product: WishlistProduct) => {
    const result = await addToCart(product.product_id);
    if (result.success) {
      showToast('success', t('wishlist.addedTitle'), t('wishlist.addedMessage', { productName: product.name }));
    } else {
      showToast('error', t('common.error'), result.message);
    }
  };

  const androidPadding = Platform.OS === 'android' ? 80 : 0;

  const renderItem = ({ item, index }: { item: WishlistProduct, index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
      <Pressable
        style={({ pressed }) => [styles.cardWrapper, { opacity: pressed ? 0.9 : 1 }]}
        onPress={() => router.push(`/product/${item.product_id}` as any)}
      >
        <GlassView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.card, { borderColor: 'rgba(255,255,255,0.1)' }]}
        >
          <View style={styles.imageContainer}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={[colors.pink + '20', colors.purple + '20']}
                style={styles.cardImagePlaceholder}
              >
                <MaterialCommunityIcons name="image-outline" size={24} color={colors.textMuted} />
              </LinearGradient>
            )}
          </View>

          <View style={styles.cardContent}>
            <View>
              <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.vendorName, { color: colors.pink }]}>
                {item.vendor_name}
              </Text>
            </View>

            <View style={styles.cardBottom}>
              <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                {Number(item.price).toLocaleString()} EGP
              </Text>

              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => handleRemove(item.product_id)}
                  style={[styles.actionBtn, { borderColor: 'rgba(255,0,0,0.3)' }]}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
                </Pressable>
                <Pressable
                  onPress={() => handleAddToCart(item)}
                  style={styles.cartBtn}
                >
                  <LinearGradient
                    colors={[colors.pink, colors.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cartBtnGradient}
                  >
                    <MaterialCommunityIcons name="plus" size={18} color="white" />
                  </LinearGradient>
                </Pressable>
              </View>
            </View>
          </View>
        </GlassView>
      </Pressable>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : products.length === 0 ? (
        <View style={{ flex: 1 }}>
          <CenteredHeader title={t('wishlist.title')} titleColor={colors.textPrimary} />
          <Animated.View entering={FadeInDown} style={styles.center}>
            <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIcon, { borderColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialCommunityIcons name="cards-heart-outline" size={56} color={colors.pink} />
            </GlassView>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('wishlist.emptyTitle')}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Heart products you love and they will appear here.
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/' as any)}
            >
              <LinearGradient
                colors={[colors.pink, colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shopBtn}
              >
                <MaterialCommunityIcons name="shopping-outline" size={18} color="white" />
                <Text style={styles.shopBtnText}>{t('wishlist.browseProducts')}</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.product_id.toString()}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.pink}
              colors={[colors.pink]}
              progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'}
            />
          }
          contentContainerStyle={[styles.list, { paddingBottom: androidPadding + 120 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <CenteredHeader title={t('wishlist.title')} titleColor={colors.textPrimary} />
              <Text style={[styles.listLabel, { color: colors.textMuted }]}>
                {products.length} item{products.length !== 1 ? 's' : ''} saved
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  list: { paddingHorizontal: Spacing.lg },
  listLabel: { fontFamily: Fonts.bold, fontSize: 10, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
  cardWrapper: { marginBottom: Spacing.md },
  card: { flexDirection: 'row', borderRadius: BorderRadius.xxl, borderWidth: 1, overflow: 'hidden', height: 110 },
  imageContainer: { width: 110, height: 110 },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, padding: Spacing.md, justifyContent: 'space-between' },
  productName: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2, letterSpacing: 0.3 },
  vendorName: { fontFamily: Fonts.bold, fontSize: FontSizes.xs },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  priceText: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },
  actionButtons: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  cartBtn: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden' },
  cartBtnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  emptyIcon: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg, overflow: 'hidden', borderWidth: 1 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginBottom: Spacing.sm },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.md, textAlign: 'center', opacity: 0.6, lineHeight: 22, marginBottom: Spacing.xl },
  shopBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: 14 },
  shopBtnText: { color: 'white', fontFamily: Fonts.bold, fontSize: FontSizes.sm },
});

