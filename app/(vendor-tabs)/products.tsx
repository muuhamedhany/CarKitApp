import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect } from 'react';
import { View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { apiFetch } from '@/services/api/client';
import { Product } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { FormInput, GlassView } from '@/components';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTabReload } from '@/hooks/useTabReload';
import Text from '@/components/common/LocalizedText';

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
type SortMode = 'latest' | 'price-desc' | 'stock-asc';

export default function VendorProductsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const currencySuffix = t('common.currency.egp');
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
    if (!user) return;
    try {
      if (!isSilent && !hasLoaded.current) setLoading(true);
      const res = await apiFetch(`/products?vendor_id=${user?.vendor_id}`);
      if (res.success) {
        setProducts(res.data);
        hasLoaded.current = true;
      }
    } catch (e: any) {
      showToast('error', t('common.error'), e.message || t('inventory.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast, t, user?.vendor_id]);

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

  const getStockBadge = useCallback((item: Product) => {
    const stock = Number(item.stock ?? 0);
    const isActive = (item as any).is_active !== false && (item as any).status !== 'disabled' && (item as any).status !== 'rejected';
    
    if (!isActive) return { label: t('inventory.badgeDisabled'), color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.15)', progressColor: '#EF4444' };
    if (stock === 0) return { label: t('inventory.filterOutOfStock'), color: '#EF4444', backgroundColor: 'rgba(239,68,68,0.15)', progressColor: '#EF4444' };
    if (stock <= 5) return { label: t('inventory.badgeLowStock'), color: '#F97316', backgroundColor: 'rgba(249,115,22,0.15)', progressColor: '#F97316' };
    return { label: t('inventory.badgeActive'), color: '#10B981', backgroundColor: 'rgba(16,185,129,0.15)', progressColor: '#10B981' };
  }, [t]);

  const [updatingStock, setUpdatingStock] = useState<number | null>(null);

  const handleStockUpdate = useCallback(async (productId: number, currentStock: number, change: number) => {
    const newStock = Math.max(0, currentStock + change);
    if (newStock === currentStock) return;

    setUpdatingStock(productId);
    try {
      const res = await apiFetch(`/products/${productId}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock }),
      });

      if (res.success) {
        setProducts(current => current.map(p => 
          p.product_id === productId ? { ...p, stock: newStock } : p
        ));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error(res.message || t('inventory.stockUpdateFailed'));
      }
    } catch (e: any) {
      showToast('error', t('common.error'), e.message || t('inventory.stockUpdateFailed'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setUpdatingStock(null);
    }
  }, [showToast, t]);

  const renderProductItem = useCallback(({ item, index }: { item: Product; index: number }) => {
    const stock = Number(item.stock ?? 0);
    const badge = getStockBadge(item);
    const maxStockRef = Math.max(50, stock); 
    const progressWidth = `${(stock / maxStockRef) * 100}%`;
    const isUpdating = updatingStock === item.product_id;

    const handleNavigate = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/vendor-product/${item.product_id}`);
    };

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50).duration(400)}
        style={styles.cardWrapper}
      >
        <GlassView
          intensity={isDark ? 20 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.productCard, { borderColor: colors.cardBorder }]}
        >
          {/* Top Section */}
          <View style={styles.cardTopSection}>
            <Image
              source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
              style={styles.productImage}
            />
            <View style={styles.productInfo}>
              <View style={styles.productHeaderRow}>
                <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
                {Number(item.price).toLocaleString('en-EG')} {currencySuffix}
              </Text>
              
              {/* Progress Bar Row */}
              <View style={styles.progressRow}>
                <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                  <View style={[styles.progressBarFill, { width: progressWidth as any, backgroundColor: badge.progressColor }]} />
                </View>
                <Text style={[styles.stockLeftText, { color: badge.color }]}>{t('inventory.stockLeft', { count: stock })}</Text>
              </View>
            </View>
          </View>

          {/* Bottom Section: Actions */}
          <View style={[styles.cardBottomSection, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            {stock === 0 ? (
              <View style={styles.actionRow}>
                {/* Out of Stock Quick Controls */}
                <View style={[styles.stockControls, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Pressable 
                    style={styles.stockBtn} 
                    disabled={isUpdating}
                    onPress={() => handleStockUpdate(item.product_id, stock, -1)}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color={colors.textSecondary} />
                  </Pressable>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.pink} style={{ minWidth: 30 }} />
                  ) : (
                    <Text style={[styles.stockControlText, { color: colors.textPrimary }]}>{stock}</Text>
                  )}
                  <Pressable 
                    style={styles.stockBtn}
                    disabled={isUpdating}
                    onPress={() => handleStockUpdate(item.product_id, stock, 1)}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Pressable 
                  style={({ pressed }) => [
                    styles.restockButton, 
                    { backgroundColor: colors.pink, opacity: pressed ? 0.8 : 1, flex: 1, paddingVertical: 0, height: 40 }
                  ]}
                  onPress={handleNavigate}
                >
                  <Text style={[styles.restockButtonText, { color: '#FFF' }]}>{t('inventory.restockNow')}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.actionRow}>
                {/* Stock Quick Controls */}
                <View style={[styles.stockControls, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                  <Pressable 
                    style={styles.stockBtn} 
                    disabled={isUpdating}
                    onPress={() => handleStockUpdate(item.product_id, stock, -1)}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color={colors.textSecondary} />
                  </Pressable>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.pink} style={{ minWidth: 30 }} />
                  ) : (
                    <Text style={[styles.stockControlText, { color: colors.textPrimary }]}>{stock}</Text>
                  )}
                  <Pressable 
                    style={styles.stockBtn}
                    disabled={isUpdating}
                    onPress={() => handleStockUpdate(item.product_id, stock, 1)}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {/* View Details Button */}
                <Pressable 
                  style={({ pressed }) => [
                    styles.viewDetailsBtn, 
                    { backgroundColor: colors.purple, opacity: pressed ? 0.8 : 1 }
                  ]}
                  onPress={handleNavigate}
                >
                  <Text style={[styles.viewDetailsBtnText, { color: '#FFF' }]}>{t('inventory.viewDetails')}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </GlassView>
      </Animated.View>
    );
  }, [colors, currencySuffix, getStockBadge, handleStockUpdate, isDark, router, t, updatingStock]);

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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{t('inventory.title')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('inventory.subtitle')}</Text>
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
                <Text style={[styles.headerActionText, { color: colors.white }]}>{t('common.add')}</Text>
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.total}</Text>
                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{t('inventory.totalItems')}</Text>
              </GlassView>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.low}</Text>
                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{t('inventory.filterLowStock')}</Text>
              </GlassView>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.out}</Text>
                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>{t('inventory.out')}</Text>
              </GlassView>
            </View>

            <View style={styles.searchWrap}>
              <FormInput
                icon="magnify"
                placeholder="inventory.searchPlaceholder"
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
                      {filter === 'all' ? t('filter.all') : filter === 'in-stock' ? t('inventory.filterActive') : filter === 'low-stock' ? t('inventory.filterLowStock') : t('inventory.filterOutOfStock')}
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
                { key: 'latest', label: 'inventory.latest' },
                { key: 'price-desc', label: 'inventory.price' },
                { key: 'stock-asc', label: 'inventory.stock' },
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
                    <Text style={[styles.sortText, { color: isActive ? colors.pink : colors.textMuted }]}>{t(option.label)}</Text>
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
                  <Text style={[styles.alertTitle, { color: '#F97316' }]}>{t('inventory.lowStockAlert')}</Text>
                  <Text style={[styles.alertText, { color: colors.textSecondary }]}>{t('inventory.lowStockAlertMessage')}</Text>
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
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('inventory.noProductsFound')}</Text>
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
    fontSize: FontSizes.sm,
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
    fontSize: FontSizes.sm,
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
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  cardTopSection: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  productInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  productHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  productName: {
    flex: 1,
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
  },
  productPrice: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    marginTop: 2,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockLeftText: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    minWidth: 45,
    textAlign: 'right',
  },
  cardBottomSection: {
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  restockButton: {
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restockButtonText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stockControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 4,
    height: 40,
  },
  stockBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockControlText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    minWidth: 30,
    textAlign: 'center',
  },
  viewDetailsBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsBtnText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
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
