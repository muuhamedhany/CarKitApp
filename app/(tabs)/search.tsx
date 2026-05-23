import {
  FormInput,
  GlassView,
  ProductCard,
  SearchSkeleton,
  ServiceCard } from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius,
  FontSizes,
  Fonts,
  Shadows,
  Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTabReload } from '@/hooks/useTabReload';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/contexts/LanguageContext';
import { vehicleService } from '@/services/api/vehicle.service';
import { Product, Vehicle } from '@/types/api.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useRef,
  useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rowDirection, textAlign } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';

const TAB_BAR_HEIGHT = 65;

type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
  image_url?: string | null;
  rating?: number;
  review_count?: number;
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
  const { addToCart, items: cartItems } = useCart();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;
  const params = useLocalSearchParams<SearchParams>();

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>((params.type as ViewMode) || 'all');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedProductCategoryIds, setSelectedProductCategoryIds] = useState<number[]>([]);
  const [selectedServiceCategoryIds, setSelectedServiceCategoryIds] = useState<number[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleFilterEnabled, setVehicleFilterEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searched, setSearched] = useState(false);
  const scrollRef = useRef<Animated.ScrollView>(null);

  useTabReload('search', () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    // Reset search
    setQuery('');
    search('', selectedProductCategoryIds, selectedServiceCategoryIds, adFilter, true);
  });

  const [adFilter, setAdFilter] = useState<{
    vendorId?: number;
    providerId?: number;
    productIds?: number[];
    serviceIds?: number[];
    categoryIds?: number[];
    title?: string;
  } | null>(null);

  const queryRef = useRef(query);
  const adFilterRef = useRef(adFilter);
  const selectedVehicleRef = useRef<Vehicle | null>(selectedVehicle);
  const vehicleFilterEnabledRef = useRef(vehicleFilterEnabled);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  useEffect(() => {
    adFilterRef.current = adFilter;
  }, [adFilter]);

  useEffect(() => {
    selectedVehicleRef.current = selectedVehicle;
  }, [selectedVehicle]);

  useEffect(() => {
    vehicleFilterEnabledRef.current = vehicleFilterEnabled;
  }, [vehicleFilterEnabled]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicles = async () => {
      if (!token) {
        setVehicles([]);
        setSelectedVehicle(null);
        return;
      }

      try {
        const response = await vehicleService.getVehicles();
        const list = response.data || [];
        if (!isMounted) return;

        setVehicles(list);
        setSelectedVehicle((current) => current || list[0] || null);
      } catch {
        if (isMounted) {
          setVehicles([]);
          setSelectedVehicle(null);
        }
      }
    };

    loadVehicles();
    return () => { isMounted = false; };
  }, [token]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const search = useCallback(async (
    searchQuery: string,
    productCategoryIds: number[],
    serviceCategoryIds: number[],
    adFilterOverride?: typeof adFilter,
    shouldShuffle = false,
  ) => {
    setLoading(true);
    setSearched(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const af = adFilterOverride !== undefined ? adFilterOverride : adFilterRef.current;

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
      const vehicle = selectedVehicleRef.current;
      const useVehicleFit = Boolean(vehicleFilterEnabledRef.current && vehicle?.vehicle_id);
      const productEndpoint = useVehicleFit
        ? `${API_URL}/products/personalized?${prodParams.toString()}&vehicle_id=${vehicle!.vehicle_id}`
        : `${API_URL}/products?${prodParams.toString()}`;

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
        fetch(productEndpoint, { headers }),
        fetch(`${API_URL}/services?${serviceParams.toString()}`, { headers }),
      ]);
      const [prodData, servData] = await Promise.all([prodRes.json(), servRes.json()]);

      let fetchedProds = prodData.data || [];
      let fetchedServs = servData.data || [];

      const shouldRandomizeDefaultView = !useVehicleFit && !searchQuery.trim() && productCategoryIds.length === 0 && serviceCategoryIds.length === 0 && !af;
      if (shouldShuffle || shouldRandomizeDefaultView) {
        if (!useVehicleFit) {
          fetchedProds = [...fetchedProds].sort(() => Math.random() - 0.5);
        }
        fetchedServs = [...fetchedServs].sort(() => Math.random() - 0.5);
      }

      if (prodData.success) setProducts(fetchedProds);
      if (servData.success) setServices(fetchedServs);
    } catch {
      showToast('error', t('common.error'), t('search.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [showToast, t, token]);

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
  }, [params.product_categories, params.service_categories, params.vendor_id, params.provider_id, params.product_ids, params.service_ids, params.ad_category_ids, params.ad_title, params.type, search]);

  useEffect(() => {
    search(queryRef.current, selectedProductCategoryIds, selectedServiceCategoryIds, adFilterRef.current);
  }, [search, selectedProductCategoryIds, selectedServiceCategoryIds, selectedVehicle?.vehicle_id, vehicleFilterEnabled]);

  const handleAddToCart = async (productId: number) => {
    const product = products.find(p => p.product_id === productId);
    if (product) {
      const itemInCart = cartItems.find(i => i.product_id_fk === productId);
      if (itemInCart && itemInCart.quantity >= (product.stock || 0)) {
        showToast('warning', t('home.limitReached'), t('home.stockLimitMessage', { stock: product.stock ?? 0 }));
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await addToCart(productId);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', t('home.addedTitle'), t('home.productAdded'));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', t('common.error'), result.message);
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

  const handleVehicleChipPress = () => {
    if (vehicles.length === 0) {
      router.push('/add-vehicle' as any);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!vehicleFilterEnabled) {
      setVehicleFilterEnabled(true);
      return;
    }

    const currentIndex = vehicles.findIndex((vehicle) => vehicle.vehicle_id === selectedVehicle?.vehicle_id);
    const nextVehicle = vehicles[(currentIndex + 1) % vehicles.length] || vehicles[0];
    setSelectedVehicle(nextVehicle);
  };

  const handleClearVehicleFilter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVehicleFilterEnabled(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await search(query, selectedProductCategoryIds, selectedServiceCategoryIds, adFilter, true);
    setRefreshing(false);
  };

  const showProducts = viewMode === 'all' || viewMode === 'products';
  const showServices = viewMode === 'all' || viewMode === 'services';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {isDark && (
        <>
          <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
          <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: colors.purple + '10' }]} />
        </>
      )}

      <Animated.View style={[styles.stickyHeader, { paddingTop: insets.top }]}>
        <GlassView
          intensity={isDark ? 20 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.headerContent, { borderRadius: BorderRadius.xl, borderColor: colors.cardBorder, borderWidth: 1, overflow: 'hidden' }]}
        >
          {/* Search Input */}
          <FormInput
            icon="magnify"
            placeholder={t('search.placeholder')}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query, selectedProductCategoryIds, selectedServiceCategoryIds, adFilter)}
            returnKeyType="search"
            rightIcon={query.length > 0 ? "close-circle" : undefined}
            onRightIconPress={() => { setQuery(''); search('', selectedProductCategoryIds, selectedServiceCategoryIds, adFilter); }}
            containerStyle={styles.searchInputForm}
          />
        </GlassView>
      </Animated.View>

      {loading && products.length === 0 && services.length === 0 ? (
        <SearchSkeleton />
      ) : (
        <View style={{ flex: 1 }}>
          <Animated.ScrollView
            ref={scrollRef}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.results, { paddingTop: 100 + insets.top }]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.pink}
                colors={[colors.pink]}
                progressBackgroundColor={isDark ? colors.surfaceElevated : '#FFFFFF'}
              />
            }
          >
            {/* Ad filter banner */}
            {adFilter && (
              <Animated.View entering={FadeInDown} style={[styles.adFilterBanner, { flexDirection: rowDirection(isRTL), backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}>
                <MaterialCommunityIcons name="bullhorn" size={18} color={colors.pink} />
                <Text style={[styles.adFilterText, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]} numberOfLines={1}>
                  {t('search.resultsFrom')} <Text style={{ fontFamily: Fonts.semiBold }}>{adFilter.title || t('search.sponsoredAd')}</Text>
                </Text>
                <Pressable onPress={handleClearAdFilter} style={styles.closeAdFilter}>
                  <MaterialCommunityIcons name="close" size={18} color={colors.textPrimary} />
                </Pressable>
              </Animated.View>
            )}
            {/* Vehicle fitment filter */}
            <Animated.View entering={FadeInDown} style={[styles.vehicleFitRow, { flexDirection: rowDirection(isRTL) }]}>
              <Pressable
                onPress={handleVehicleChipPress}
                style={[styles.vehicleFitChip, { flexDirection: rowDirection(isRTL), backgroundColor: colors.surfaceElevated, borderColor: vehicleFilterEnabled && selectedVehicle ? colors.pink : colors.cardBorder }]}
              >
                <MaterialCommunityIcons
                  name={vehicleFilterEnabled && selectedVehicle ? "car-select" : "car-outline"}
                  size={18}
                  color={vehicleFilterEnabled && selectedVehicle ? colors.pink : colors.textSecondary}
                />
                <Text style={[styles.vehicleFitText, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]} numberOfLines={1}>
                  {selectedVehicle && vehicleFilterEnabled
                    ? `Fits your ${selectedVehicle.make_name} ${selectedVehicle.model_name}`
                    : vehicles.length > 0
                      ? 'All vehicles'
                      : 'Add vehicle'}
                </Text>
                {vehicles.length > 1 && vehicleFilterEnabled && selectedVehicle && (
                  <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.textSecondary} />
                )}
              </Pressable>

              {selectedVehicle && vehicleFilterEnabled && (
                <Pressable
                  onPress={handleClearVehicleFilter}
                  style={[styles.vehicleClearBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}
                >
                  <MaterialCommunityIcons name="close" size={17} color={colors.pink} />
                </Pressable>
              )}
            </Animated.View>
            {/* Mode toggle */}
            <View style={[styles.toggleRow, { flexDirection: rowDirection(isRTL), marginBottom: Spacing.lg }]}>
              <View style={[styles.toggleContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
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
                      {t(`search.${mode}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Category Filter Button */}
              <Pressable
                style={[styles.filterBtn, { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder }]}
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

            {showProducts && products.length > 0 && (
              <Animated.View entering={FadeInDown.duration(600)} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('search.products')}</Text>
                  <Text style={[styles.resultCount, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>{t('search.showingProducts', { count: products.length })}</Text>
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
                        rating={p.rating}
                        reviewCount={p.review_count}
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
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('search.services')}</Text>
                  <Text style={[styles.resultCount, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>{t('search.showingServices', { count: services.length })}</Text>
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
                      rating={s.rating}
                      reviewCount={s.review_count}
                      onView={() => router.push(`/service/${s.service_id}`)}
                      onBookNow={() => router.push(`/service/${s.service_id}`)}
                    />
                  </Animated.View>
                ))}
              </Animated.View>
            )}

            {searched && products.length === 0 && services.length === 0 && (
              <Animated.View entering={FadeInUp} style={styles.emptyState}>
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIconBlur, { borderColor: colors.cardBorder }]}>
                  <MaterialCommunityIcons name="magnify-close" size={48} color={colors.pink} />
                </GlassView>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('search.noResultsTitle')}</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('search.noResultsSubtitle')}</Text>

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
                  <Text style={styles.resetBtnText}>{t('search.clearFilters')}</Text>
                </Pressable>
              </Animated.View>
            )}

            <View style={{ height: androidTabOffset + Spacing.xl }} />
          </Animated.ScrollView>

          {/* Glowing Translucent Spinning Circle Overlay */}
          {loading && (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={styles.loadingOverlay}
            >
              <GlassView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={[styles.loadingGlass, { borderColor: colors.cardBorder }]}>
                <ActivityIndicator size="large" color={colors.pink} />
                <Text style={[styles.loadingOverlayText, { color: colors.textPrimary }]}>{t('search.shuffling')}</Text>
              </GlassView>
            </Animated.View>
          )}
        </View>
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
    top: -50,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: Spacing.md },
  results: { paddingHorizontal: Spacing.md },

  searchInputForm: {
    marginTop: Spacing.md,
  },

  adFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  adFilterText: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  closeAdFilter: { padding: 4 },

  vehicleFitRow: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  vehicleFitChip: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  vehicleFitText: {
    flex: 1,
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  vehicleClearBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginBottom: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xl,
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
    paddingHorizontal: 2,
    marginBottom: 4,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 999,
  },
  loadingGlass: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingOverlayText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
});

