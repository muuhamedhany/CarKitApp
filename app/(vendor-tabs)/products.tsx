import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { Product } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { FormInput } from '@/components';

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SortMode = 'latest' | 'price-desc' | 'stock-asc';

export default function VendorProductsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');

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

  const getStockBadge = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', backgroundColor: 'rgba(239,68,68,0.16)', color: '#EF4444' };
    if (stock <= 5) return { label: 'Low Stock', backgroundColor: 'rgba(249,115,22,0.16)', color: '#F97316' };
    return { label: 'Active', backgroundColor: 'rgba(16,185,129,0.16)', color: '#10B981' };
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable
      onPress={() => router.push(`/edit-product/${item.product_id}`)}
      style={({ pressed }) => [styles.productPressable, styles.productListItem, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
              <Text style={[styles.productCategory, { color: colors.textMuted }]} numberOfLines={1}>
                {item.category_name || 'Uncategorized'}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStockBadge(Number(item.stock ?? 0)).backgroundColor }]}>
              <Text style={[styles.statusBadgeText, { color: getStockBadge(Number(item.stock ?? 0)).color }]}>
                {getStockBadge(Number(item.stock ?? 0)).label}
              </Text>
            </View>
          </View>
          <Text style={[styles.productPrice, { color: colors.pink }]}>{Number(item.price).toLocaleString('en-EG')} EGP</Text>
          <Text style={[styles.productStock, { color: colors.textMuted }]}>Stock: {item.stock ?? 0}</Text>
        </View>
      </View>
    </Pressable>
  );

  const hasLowStock = normalizedProducts.some((product) => Number(product.stock ?? 0) <= 5);

  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Inventory</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{totals.total} items · {totals.low} low stock · {totals.out} out of stock</Text>
        </View>
        <Pressable onPress={() => router.push('/(vendor-tabs)/add-product')} style={[styles.headerAction, { backgroundColor: colors.pink }]}>
          <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <FormInput
          icon="magnify"
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.total}</Text>
          <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Total Items</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.low}</Text>
          <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Low Stock</Text>
        </View>
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.out}</Text>
          <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Out</Text>
        </View>
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
              onPress={() => setStockFilter(filter)}
              style={[
                styles.filterChip,
                { backgroundColor: isActive ? colors.pink : colors.backgroundSecondary, borderColor: isActive ? colors.pink : colors.cardBorder },
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
              onPress={() => setSortMode(option.key)}
              style={[
                styles.sortChip,
                { backgroundColor: isActive ? colors.backgroundSecondary : colors.card, borderColor: isActive ? colors.pink : colors.border },
              ]}
            >
              <MaterialCommunityIcons name="sort" size={14} color={isActive ? colors.pink : colors.textMuted} />
              <Text style={[styles.sortText, { color: isActive ? colors.pink : colors.textMuted }]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {hasLowStock && (
        <View style={[styles.alertBox, { backgroundColor: 'rgba(249,115,22,0.12)', borderColor: 'rgba(249,115,22,0.6)' }]}>
          <MaterialCommunityIcons name="alert-outline" size={22} color="#F97316" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Low Stock Alert</Text>
            <Text style={styles.alertText}>Some products are reaching critical stock levels. Restock soon.</Text>
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={loading ? [] : normalizedProducts}
        keyExtractor={(item) => item.product_id?.toString() || Math.random().toString()}
        renderItem={renderProduct}
        ListHeaderComponent={renderHeader}
        ItemSeparatorComponent={() => <View style={styles.productSeparator} />}
        contentContainerStyle={styles.screenContent}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={colors.pink} style={styles.loadingState} />
          ) : (
            <View style={[styles.emptyState]}>
              <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products found.</Text>
            </View>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  headerAction: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    paddingHorizontal: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  statsCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    minHeight: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontFamily: Fonts.semiBold,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    minHeight: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sortText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  alertBox: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
  },
});
