import { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { Product } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { FormInput, GlassView} from '@/components';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SortMode = 'latest' | 'price-desc' | 'stock-asc';

export default function VendorProductsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/products?vendor_id=${user?.vendor_id}`);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.vendor_id]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const normalizedProducts = products
    .filter((product) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || [product.name, product.description, product.category_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));

      const stock = Number(product.stock ?? 0);
      const matchesStockFilter =
        stockFilter === 'all' ||
        (stockFilter === 'in-stock' && stock > 5) ||
        (stockFilter === 'low-stock' && stock > 0 && stock <= 5) ||
        (stockFilter === 'out-of-stock' && stock === 0);

      return matchesSearch && matchesStockFilter;
    })
    .sort((left, right) => {
      if (sortMode === 'price-desc') {
        return Number(right.price) - Number(left.price);
      }

      if (sortMode === 'stock-asc') {
        return Number(left.stock ?? 0) - Number(right.stock ?? 0);
      }

      return Number(right.product_id) - Number(left.product_id);
    });

  const totals = products.reduce(
    (accumulator, product) => {
      const stock = Number(product.stock ?? 0);
      accumulator.total += 1;
      if (stock === 0) accumulator.out += 1;
      else if (stock <= 5) accumulator.low += 1;
      else accumulator.good += 1;
      return accumulator;
    },
    { total: 0, low: 0, out: 0, good: 0 }
  );

  const getStockBadge = (product: Product) => {
    const status = String(product.status || '').toLowerCase();
     if (status === 'pending') {
       return { label: 'Pending Approval', backgroundColor: 'rgba(59,130,246,0.16)', color: '#3B82F6' };
     }
     if (status && status !== 'active') {
       return { label: 'Disabled', backgroundColor: 'rgba(239,68,68,0.16)', color: '#EF4444' };
    }

    const stock = Number(product.stock ?? 0);
    if (stock === 0) return { label: 'Out of Stock', backgroundColor: 'rgba(239,68,68,0.16)', color: '#EF4444' };
    if (stock <= 5) return { label: 'Low Stock', backgroundColor: 'rgba(249,115,22,0.16)', color: '#F97316' };
    return { label: 'Active', backgroundColor: 'rgba(16,185,129,0.16)', color: '#10B981' };
  };

  const renderProduct = ({ item, index }: { item: Product, index: number }) => {
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(600)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/vendor-product/${item.product_id}`);
          }}
          style={({ pressed }) => [
            styles.productPressable,
            styles.productListItem,
            { transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
        >
          <GlassView 
            intensity={isDark ? 20 : 40} 
            tint={isDark ? 'dark' : 'light'} 
            style={[styles.productCard, { borderColor: colors.cardBorder }]}
          >
            <Image
              source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <View style={styles.productHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.productCategory, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.category_name || 'Uncategorized'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStockBadge(item).backgroundColor }]}>
                  <Text style={[styles.statusBadgeText, { color: getStockBadge(item).color }]}>
                    {getStockBadge(item).label}
                  </Text>
                </View>
              </View>
              <Text style={[styles.productPrice, { color: colors.pink }]}>{Number(item.price).toLocaleString('en-EG')} EGP</Text>
              <Text style={[styles.productStock, { color: colors.textMuted }]}>Stock: {item.stock ?? 0}</Text>
            </View>
          </GlassView>
        </Pressable>
      </Animated.View>
    );
  };

  const hasLowStock = normalizedProducts.some((product) => Number(product.stock ?? 0) <= 5);

  const renderHeader = () => (
    <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
      <View style={styles.headerTop}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your product catalog</Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/add-product`);
          }}
          hitSlop={8}
          style={[styles.headerAction, { backgroundColor: colors.pink }]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
          <Text style={[styles.headerActionText, { color: colors.white }]}>Add</Text>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.total}</Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Items</Text>
        </GlassView>
        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.low}</Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Low Stock</Text>
        </GlassView>
        <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.out}</Text>
          <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Out</Text>
        </GlassView>
      </View>

      <View style={styles.searchWrap}>
        <FormInput
          icon="magnify"
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.controlsScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {(['all', 'in-stock', 'low-stock', 'out-of-stock'] as StockFilter[]).map((filter) => {
          const isActive = stockFilter === filter;
          return (
            <Pressable
              key={filter}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStockFilter(filter);
              }}
              style={[
                styles.filterChip,
                { backgroundColor: isActive ? colors.pink : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'), borderColor: isActive ? colors.pink : colors.cardBorder },
              ]}
            >
              <Text style={[styles.filterText, { color: isActive ? colors.white : colors.textPrimary }]}>
                {filter === 'all' ? 'All' : filter === 'in-stock' ? 'Active' : filter === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.controlsScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        {([
          { key: 'latest', label: 'Latest' },
          { key: 'price-desc', label: 'Price' },
          { key: 'stock-asc', label: 'Stock' },
        ] as const).map((option) => {
          const isActive = sortMode === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSortMode(option.key);
              }}
              style={[
                styles.sortChip,
                { backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent', borderColor: isActive ? colors.pink : colors.cardBorder },
              ]}
            >
              <MaterialCommunityIcons name="sort" size={14} color={isActive ? colors.pink : colors.textMuted} />
              <Text style={[styles.sortText, { color: isActive ? colors.pink : colors.textMuted }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {hasLowStock && (
        <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.alertBox, { borderColor: 'rgba(249,115,22,0.5)' }]}>
          <MaterialCommunityIcons name="alert-outline" size={22} color="#F97316" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Low Stock Alert</Text>
            <Text style={styles.alertText}>Some products are reaching critical stock levels. Restock soon.</Text>
          </View>
        </GlassView>
      )}
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <FlatList
        data={loading ? [] : normalizedProducts}
        keyExtractor={(item) => item.product_id?.toString() || Math.random().toString()}
        renderItem={renderProduct}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.productSeparator} />}
        contentContainerStyle={[styles.screenContent, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.pink} style={styles.loadingState} />
          ) : (
            <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.emptyState, { borderColor: colors.cardBorder, marginHorizontal: Spacing.md }]}>
              <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products found.</Text>
            </GlassView>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    marginTop: 4,
    opacity: 0.8,
  },
  headerAction: {
    paddingHorizontal: 20,
    height: 44,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  headerActionText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  searchWrap: {
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statsCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  statsValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  statsLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  controlsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 56,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    minHeight: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  filterText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sortChip: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...Shadows.sm,
  },
  sortText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xs,
  },
  alertBox: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  alertTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    color: '#F97316',
  },
  alertText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    color: '#F97316',
    marginTop: 2,
  },
  screenContent: {
    paddingBottom: 120,
  },
  loadingState: {
    marginTop: 50,
  },
  productListItem: {
    marginHorizontal: Spacing.md,
  },
  productSeparator: {
    height: Spacing.sm,
  },
  productPressable: {
    borderRadius: BorderRadius.lg,
  },
  productCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: '#333',
  },
  productInfo: {
    marginLeft: Spacing.md,
    justifyContent: 'center',
    flex: 1,
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  productName: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  productCategory: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  productPrice: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  productStock: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  editBadgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  emptyText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
  },
});
