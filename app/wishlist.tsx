import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { API_URL } from '@/constants/config';
import { Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

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
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { wishlist, toggleWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get all wishlisted product IDs
  const wishlistIds = Object.entries(wishlist)
    .filter(([, isWishlisted]) => isWishlisted)
    .map(([id]) => Number(id));

  const fetchWishlistProducts = useCallback(async () => {
    try {
      if (wishlistIds.length === 0) {
        setProducts([]);
        return;
      }
      // Fetch each product detail in parallel
      const results = await Promise.allSettled(
        wishlistIds.map(pid => fetch(`${API_URL}/products/${pid}`).then(r => r.json()))
      );
      const fetched: WishlistProduct[] = results
        .filter(r => r.status === 'fulfilled' && (r as any).value?.success)
        .map(r => (r as any).value.data);
      setProducts(fetched);
    } catch {
      // silent — wishlist context already handles errors
    }
  }, [JSON.stringify(wishlistIds)]);

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
      showToast('success', 'Added to Cart', `${product.name} added to your cart.`);
    } else {
      showToast('error', 'Error', result.message);
    }
  };

  const androidPadding = Platform.OS === 'android' ? insets.bottom + 65 : 0;

  const renderItem = ({ item }: { item: WishlistProduct }) => (
    <Pressable
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={() => router.push(`/product/${item.product_id}` as any)}
    >
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={styles.titleContainer}>
            <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.vendorName, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.vendor_name}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={[styles.priceText, { color: colors.textPrimary }]}>
            {item.price} EGP
          </Text>
          
          <View style={styles.actionButtons}>
            <Pressable
              onPress={() => handleRemove(item.product_id)}
              style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: colors.cardBorder }]}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
            </Pressable>
            <Pressable
              onPress={() => handleAddToCart(item)}
              style={[styles.actionBtn, { backgroundColor: colors.pink, borderColor: colors.pink }]}
              hitSlop={8}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Wishlist</Text>
        {wishlistIds.length > 0 ? (
          <View style={[styles.countBadge, { backgroundColor: colors.pink }]}>
            <Text style={styles.countText}>{wishlistIds.length}</Text>
          </View>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : products.length === 0 ? (
        /* Empty State */
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <MaterialCommunityIcons name="cards-heart-outline" size={56} color={colors.pink} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No items yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Heart products you love and they'll appear here.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/' as any)}
            style={[styles.shopBtn, { borderColor: colors.pink }]}
          >
            <MaterialCommunityIcons name="shopping-outline" size={18} color={colors.pink} />
            <Text style={[styles.shopBtnText, { color: colors.pink }]}>Browse Products</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.product_id.toString()}
          numColumns={1}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.pink}
              colors={[colors.pink]}
            />
          }
          contentContainerStyle={[styles.list, { paddingBottom: androidPadding + 24 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.listLabel, { color: colors.textSecondary }]}>
              {products.length} item{products.length !== 1 ? 's' : ''} saved
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
  },
  countBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },

  // List
  list: { paddingHorizontal: Spacing.sm },
  listLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.sm,
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    height: 100,
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
  },
  productName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  vendorName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceText: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.xl,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
  },
  shopBtnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
});
