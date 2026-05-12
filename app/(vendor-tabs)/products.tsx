import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { Product } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { FormInput, GlassView } from '@/components';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTabReload } from '@/hooks/useTabReload';

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SortMode = 'latest' | 'price-desc' | 'stock-asc';

export default function VendorProductsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList>(null);
  const hasLoaded = useRef(false);

  const fetchProducts = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent && !hasLoaded.current) setLoading(true);
      const res = await apiFetch(`/products?vendor_id=${user?.vendor_id}`);
      if (res.success) {
        setProducts(res.data);
        hasLoaded.current = true;
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, user?.vendor_id]);

  // Initial load only
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle incoming filters from Dashboard
  useEffect(() => {
    if (params.filter && (['all', 'in-stock', 'low-stock', 'out-of-stock'] as string[]).includes(params.filter)) {
      setStockFilter(params.filter as StockFilter);
    }
  }, [params.filter]);

  // Tab reload behavior
  useTabReload('products', () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    onRefresh();
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(true);
  }, [fetchProducts]);

  const normalizedProducts = useMemo(() => {
    let filtered = products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (stockFilter === 'in-stock') {
      filtered = filtered.filter((p) => Number(p.stock ?? 0) > 5);
    } else if (stockFilter === 'low-stock') {
      filtered = filtered.filter((p) => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= 5);
    } else if (stockFilter === 'out-of-stock') {
      filtered = filtered.filter((p) => Number(p.stock ?? 0) === 0);
    }

    if (sortMode === 'latest') {
      filtered.sort((a, b) => (b.product_id || 0) - (a.product_id || 0));
    } else if (sortMode === 'price-desc') {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortMode === 'stock-asc') {
      filtered.sort((a, b) => Number(a.stock ?? 0) - Number(b.stock ?? 0));
    }

    return filtered;
  }, [products, searchQuery, stockFilter, sortMode]);

  const totals = useMemo(() => ({
    total: products.length,
    low: products.filter(p => Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) <= 5).length,
    out: products.filter(p => Number(p.stock ?? 0) === 0).length,
  }), [products]);

  const getStockBadge = (item: Product) => {
    const stock = Number(item.stock ?? 0);
    if (stock === 0) return { label: 'Out', color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)' };
    if (stock <= 5) return { label: 'Low', color: '#F97316', backgroundColor: 'rgba(249,115,22,0.1)' };
    return { label: 'Active', color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' };
  };

  const renderProductItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    return (
      <Animated.View 
        entering={FadeInUp.delay(index * 50).duration(400)}
        style={styles.cardWrapper}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/vendor-product/${item.product_id}`);
          }}
          style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
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
  }, [colors, isDark, router]);

  const hasLowStock = useMemo(() => products.some((product) => Number(product.stock ?? 0) > 0 && Number(product.stock ?? 0) <= 5), [products]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <FlatList
        ref={listRef}
        data={normalizedProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => String(item.product_id)}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
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
                      { backgroundColor: isActive ? colors.pink : (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'), borderColor: isActive ? colors.pink : colors.cardBorder },
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
              <GlassView intensity={isDark ? 15 : 25} tint={isDark ? 'dark' : 'light'} style={[styles.alertBox, { borderColor: 'rgba(249,115,22,0.2)' }]}>
                <View style={[styles.alertIconContainer, { backgroundColor: 'rgba(249,115,22,0.15)' }]}>
                  <MaterialCommunityIcons name="alert-decagram" size={20} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: '#F97316' }]}>Low Stock Alert</Text>
                  <Text style={[styles.alertText, { color: colors.textSecondary }]}>Some products are reaching critical stock levels. Restock soon.</Text>
                </View>
              </GlassView>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.pink} style={styles.loadingState} />
          ) : (
            <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={styles.emptyState}>
              <MaterialCommunityIcons name="package-variant-closed" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products found</Text>
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
  listContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  headerActionText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  statsValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  statsLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },
  searchWrap: {
    marginBottom: Spacing.md,
  },
  controlsScroll: {
    marginHorizontal: -Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
  sortRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 4,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  sortText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
    backgroundColor: 'rgba(249,115,22,0.05)',
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    letterSpacing: 0.3,
  },
  alertText: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  productImage: {
    width: 90,
    height: 90,
    borderRadius: BorderRadius.lg,
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  productHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  productCategory: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 8,
    textTransform: 'uppercase',
  },
  productPrice: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  productStock: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    marginTop: 2,
  },
  loadingState: {
    marginTop: 100,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 50,
  },
  emptyText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
  },
});
