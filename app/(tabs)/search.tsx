import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { ProductCard, ServiceCard, SearchSkeleton } from '@/components';
import { Product } from '@/types/api.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;

type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
  image_url?: string | null;
};

type ViewMode = 'all' | 'products' | 'services';

type SearchParams = {
  product_categories?: string;
  service_categories?: string;
  vendor_id?: string;
  provider_id?: string;
  product_ids?: string;
  service_ids?: string;
  ad_category_ids?: string;
  ad_title?: string;
  type?: ViewMode;
};

const parseIds = (raw?: string) =>
  raw && raw.trim().length > 0
    ? raw.split(',').map(Number).filter((v) => Number.isFinite(v) && v > 0)
    : [];

export default function SearchScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;
  const params = useLocalSearchParams<SearchParams>();

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>((params.type as ViewMode) || 'all');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProductCategoryIds, setSelectedProductCategoryIds] = useState<number[]>([]);
  const [selectedServiceCategoryIds, setSelectedServiceCategoryIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [adFilter, setAdFilter] = useState<{
    vendorId?: number;
    providerId?: number;
    productIds?: number[];
    serviceIds?: number[];
    categoryIds?: number[];
    title?: string;
  } | null>(null);

  const queryRef = useRef(query);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const borderAlpha = interpolate(scrollY.value, [0, 20], [0, 0.1], Extrapolate.CLAMP);
    return {
      borderBottomWidth: 1,
      borderBottomColor: `rgba(255,255,255,${borderAlpha})`,
    };
  });

  const search = useCallback(async (
    searchQuery: string,
    productCategoryIds: number[],
    serviceCategoryIds: number[],
    adFilterOverride?: typeof adFilter,
  ) => {
    setLoading(true);
    setSearched(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const af = adFilterOverride !== undefined ? adFilterOverride : adFilter;

      const prodParams = new URLSearchParams();
      if (searchQuery.trim()) prodParams.set('search', searchQuery.trim());
      if (af?.vendorId) prodParams.set('vendor_id', String(af.vendorId));
      if (af?.productIds && af.productIds.length > 0) {
        prodParams.set('product_ids', af.productIds.join(','));
      }
      if (productCategoryIds.length > 0) {
        prodParams.set('category_ids', productCategoryIds.join(','));
      } else if (af?.categoryIds && af.categoryIds.length > 0 && af?.vendorId) {
        prodParams.set('category_ids', af.categoryIds.join(','));
      }
      prodParams.set('page', '1');
      prodParams.set('pageSize', '50');

      const serviceParams = new URLSearchParams();
      if (searchQuery.trim()) serviceParams.set('search', searchQuery.trim());
      if (af?.providerId) serviceParams.set('provider_id', String(af.providerId));
      if (af?.serviceIds && af.serviceIds.length > 0) {
        serviceParams.set('service_ids', af.serviceIds.join(','));
      }
      if (serviceCategoryIds.length > 0) {
        serviceParams.set('category_ids', serviceCategoryIds.join(','));
      } else if (af?.categoryIds && af.categoryIds.length > 0 && af?.providerId) {
        serviceParams.set('category_ids', af.categoryIds.join(','));
      }
      serviceParams.set('page', '1');
      serviceParams.set('pageSize', '50');

      const [prodRes, servRes] = await Promise.all([
        fetch(`${API_URL}/products?${prodParams.toString()}`, { headers }),
        fetch(`${API_URL}/services?${serviceParams.toString()}`, { headers }),
      ]);
      const [prodData, servData] = await Promise.all([prodRes.json(), servRes.json()]);
      if (prodData.success) setProducts(prodData.data || []);
      if (servData.success) setServices(servData.data || []);
    } catch {
      showToast('error', 'Error', 'Could not fetch results.');
    } finally {
      setLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    const vendorIdRaw = Array.isArray(params.vendor_id) ? params.vendor_id[0] : params.vendor_id;
    const providerIdRaw = Array.isArray(params.provider_id) ? params.provider_id[0] : params.provider_id;
    const productIdsRaw = Array.isArray(params.product_ids) ? params.product_ids[0] : params.product_ids;
    const serviceIdsRaw = Array.isArray(params.service_ids) ? params.service_ids[0] : params.service_ids;
    const adCategoryIdsRaw = Array.isArray(params.ad_category_ids) ? params.ad_category_ids[0] : params.ad_category_ids;
    const adTitleRaw = Array.isArray(params.ad_title) ? params.ad_title[0] : params.ad_title;

    const hasAdFilter = vendorIdRaw || providerIdRaw || productIdsRaw || serviceIdsRaw || adCategoryIdsRaw;

    const newAdFilter = hasAdFilter
      ? {
          vendorId: vendorIdRaw ? Number(vendorIdRaw) : undefined,
          providerId: providerIdRaw ? Number(providerIdRaw) : undefined,
          productIds: parseIds(productIdsRaw),
          serviceIds: parseIds(serviceIdsRaw),
          categoryIds: parseIds(adCategoryIdsRaw),
          title: adTitleRaw || undefined,
        }
      : null;

    setAdFilter(newAdFilter);

    const rawProducts = Array.isArray(params.product_categories) ? params.product_categories[0] : params.product_categories;
    const rawServices = Array.isArray(params.service_categories) ? params.service_categories[0] : params.service_categories;
    const parsedProducts = parseIds(rawProducts);
    const parsedServices = parseIds(rawServices);
    setSelectedProductCategoryIds(parsedProducts);
    setSelectedServiceCategoryIds(parsedServices);
    if (params.type) setViewMode(params.type as ViewMode);

    search(queryRef.current, parsedProducts, parsedServices, newAdFilter);
  }, [params.product_categories, params.service_categories, params.vendor_id, params.provider_id, params.product_ids, params.service_ids, params.ad_category_ids, params.type]);

  const handleAddToCart = async (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await addToCart(productId);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', 'Added!', 'Product added to your cart.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Error', result.message);
    }
  };

  const handleClearAdFilter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAdFilter(null);
    router.setParams({
      vendor_id: '',
      provider_id: '',
      product_ids: '',
      service_ids: '',
      ad_category_ids: '',
      ad_title: '',
    });
    search(query, selectedProductCategoryIds, selectedServiceCategoryIds, null);
  };

  const showProducts = viewMode === 'all' || viewMode === 'products';
  const showServices = viewMode === 'all' || viewMode === 'services';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: colors.purple + '10' }]} />

      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top }, headerStyle]}>
        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          {/* Search Input */}
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={[styles.searchInputContainer, { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderColor: colors.cardBorder 
          }]}>
            <MaterialCommunityIcons name="magnify" size={22} color={colors.pink} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search for parts or services..."
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => search(query, selectedProductCategoryIds, selectedServiceCategoryIds, adFilter)}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { setQuery(''); search('', selectedProductCategoryIds, selectedServiceCategoryIds, adFilter); }}>
                <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
              </Pressable>
            )}
          </Animated.View>

          {/* Ad filter banner */}
          {adFilter && (
            <Animated.View entering={FadeInDown} style={[styles.adFilterBanner, { backgroundColor: colors.pink + '15', borderColor: colors.pink + '30' }]}>
              <MaterialCommunityIcons name="bullhorn" size={18} color={colors.pink} />
              <Text style={[styles.adFilterText, { color: colors.textPrimary }]} numberOfLines={1}>
                Results from <Text style={{ fontFamily: Fonts.bold }}>{adFilter.title || 'Sponsored Ad'}</Text>
              </Text>
              <Pressable onPress={handleClearAdFilter} style={styles.closeAdFilter}>
                <MaterialCommunityIcons name="close" size={18} color={colors.textPrimary} />
              </Pressable>
            </Animated.View>
          )}

          {/* Mode toggle */}
          <View style={styles.toggleRow}>
            <View style={[styles.toggleContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: colors.cardBorder }]}>
              {(['all', 'products', 'services'] as ViewMode[]).map((mode) => (
                <Pressable
                  key={mode}
                  style={[
                    styles.togglePill,
                    viewMode === mode && { backgroundColor: colors.pink },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode(mode); }}
                >
                  <Text style={[
                    styles.toggleText,
                    { color: colors.textSecondary },
                    viewMode === mode && { color: '#FFFFFF' },
                  ]}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            {/* Category Filter Button */}
            <Pressable 
              style={[styles.filterBtn, { backgroundColor: colors.pink + '15', borderColor: colors.pink + '30' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({
                  pathname: '/category-filter',
                  params: {
                    product_categories: selectedProductCategoryIds.join(','),
                    service_categories: selectedServiceCategoryIds.join(','),
                  },
                });
              }}
            >
              <MaterialCommunityIcons name="filter-variant" size={20} color={colors.pink} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {loading ? (
        <SearchSkeleton />
      ) : (
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.results, { paddingTop: 200 + insets.top + (adFilter ? 60 : 0) }]}
        >
          {showProducts && products.length > 0 && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Products</Text>
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{products.length} found</Text>
              </View>
              <View style={styles.productGrid}>
                {products.map((p, idx) => (
                  <Animated.View 
                    entering={FadeInUp.delay(idx * 50).duration(600)} 
                    key={p.product_id} 
                    style={styles.productGridItem}
                  >
                    <ProductCard
                      productId={p.product_id}
                      name={p.name}
                      price={p.price}
                      imageUrl={p.image_url}
                      vendorName={p.vendor_name}
                      onAddToCart={() => handleAddToCart(p.product_id)}
                      onPress={() => router.push(`/product/${p.product_id}` as any)}
                    />
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {showServices && services.length > 0 && (
            <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Services</Text>
                <Text style={[styles.resultCount, { color: colors.textSecondary }]}>{services.length} found</Text>
              </View>
              {services.map((s, idx) => (
                <Animated.View 
                  entering={FadeInUp.delay(idx * 100).duration(600)}
                  key={s.service_id}
                  style={{ marginBottom: Spacing.md }}
                >
                  <ServiceCard
                    name={s.name}
                    providerName={s.provider_name}
                    price={s.price}
                    imageUrl={s.image_url}
                    duration={s.duration || undefined}
                    onView={() => router.push(`/service/${s.service_id}`)}
                    onBookNow={() => router.push(`/service/${s.service_id}`)}
                  />
                </Animated.View>
              ))}
            </Animated.View>
          )}

          {searched && products.length === 0 && services.length === 0 && (
            <Animated.View entering={FadeInUp} style={styles.emptyState}>
              <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.emptyIconBlur}>
                <MaterialCommunityIcons name="magnify-close" size={48} color={colors.pink} />
              </BlurView>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Results Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Try adjusting your search or filters to find what you're looking for.</Text>
              
              <Pressable 
                style={[styles.resetBtn, { backgroundColor: colors.pink }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setQuery('');
                  setSelectedProductCategoryIds([]);
                  setSelectedServiceCategoryIds([]);
                  handleClearAdFilter();
                }}
              >
                <Text style={styles.resetBtnText}>Clear All Filters</Text>
              </Pressable>
            </Animated.View>
          )}

          <View style={{ height: androidTabOffset + Spacing.xl }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: Spacing.md },
  results: { paddingHorizontal: Spacing.lg },

  searchInputContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: BorderRadius.xl, 
    paddingHorizontal: Spacing.md, 
    paddingVertical: 12,
    borderWidth: 1,
    ...Shadows.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1, 
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md, 
    marginLeft: Spacing.sm, 
    paddingVertical: 4,
  },

  adFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  adFilterText: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  closeAdFilter: { padding: 4 },

  toggleRow: {
    flexDirection: 'row', 
    gap: Spacing.sm,
    alignItems: 'center',
  },
  toggleContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 4,
    height: 52,
  },
  togglePill: {
    flex: 1,
    borderRadius: BorderRadius.lg, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: { 
    fontFamily: Fonts.bold, 
    fontSize: 11, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Fonts.extraBold, 
    fontSize: FontSizes.xxl,
    letterSpacing: -1,
  },
  resultCount: { 
    fontFamily: Fonts.medium, 
    fontSize: FontSizes.xs, 
    opacity: 0.6 
  },
  productGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginHorizontal: -8 
  },
  productGridItem: { 
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },

  emptyState: { 
    alignItems: 'center', 
    marginTop: 40,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconBlur: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: { 
    fontFamily: Fonts.extraBold, 
    fontSize: FontSizes.xl, 
    marginBottom: Spacing.sm 
  },
  emptySubtitle: { 
    fontFamily: Fonts.medium, 
    fontSize: FontSizes.md, 
    textAlign: 'center', 
    lineHeight: 22,
    opacity: 0.7,
    marginBottom: Spacing.xxl,
  },
  resetBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  resetBtnText: {
    color: '#fff',
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
});

