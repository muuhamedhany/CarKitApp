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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { ProductCard, ServiceCard } from '@/components';
import { Product } from '@/types/api.types';

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
  // Ad targeting params
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
  const { colors } = useTheme();
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

  // Ad targeting filter
  const [adFilter, setAdFilter] = useState<{
    vendorId?: number;
    providerId?: number;
    productIds?: number[];
    serviceIds?: number[];
    categoryIds?: number[];
    title?: string;
  } | null>(null);

  const queryRef = useRef(query);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

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

      // ── Product query params ──
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

      // ── Service query params ──
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
      if (servData.success) {
        setServices(servData.data || []);
      }
    } catch {
      showToast('error', 'Error', 'Could not fetch results.');
    } finally {
      setLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    // Parse ad targeting params
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

    // Parse normal category params
    const rawProducts = Array.isArray(params.product_categories)
      ? params.product_categories[0]
      : params.product_categories;
    const rawServices = Array.isArray(params.service_categories)
      ? params.service_categories[0]
      : params.service_categories;
    const parsedProducts = parseIds(rawProducts);
    const parsedServices = parseIds(rawServices);
    setSelectedProductCategoryIds(parsedProducts);
    setSelectedServiceCategoryIds(parsedServices);
    if (params.type) {
      setViewMode(params.type as ViewMode);
    }

    search(queryRef.current, parsedProducts, parsedServices, newAdFilter);
  }, [params.product_categories, params.service_categories, params.vendor_id, params.provider_id, params.product_ids, params.service_ids, params.ad_category_ids, params.type]);

  const handleOpenCategoryFilter = () => {
    router.push({
      pathname: '/category-filter',
      params: {
        product_categories: selectedProductCategoryIds.join(','),
        service_categories: selectedServiceCategoryIds.join(','),
      },
    });
  };

  const handleClearCategories = () => {
    setSelectedProductCategoryIds([]);
    setSelectedServiceCategoryIds([]);
    search(query, [], [], adFilter);
  };

  const handleClearAdFilter = () => {
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

  const handleAddToCart = async (productId: number) => {
    const result = await addToCart(productId);
    if (result.success) {
      showToast('success', 'Added!', 'Product added to your cart.');
    } else {
      showToast('error', 'Error', result.message);
    }
  };

  const showProducts = viewMode === 'all' || viewMode === 'products';
  const showServices = viewMode === 'all' || viewMode === 'services';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.backgroundSecondary, borderWidth: 2, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search products, services..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query, selectedProductCategoryIds, selectedServiceCategoryIds, adFilter)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery('');
                search('', selectedProductCategoryIds, selectedServiceCategoryIds, adFilter);
              }}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Ad filter banner */}
      {adFilter && (
        <View style={[styles.adFilterBanner, { backgroundColor: colors.pinkGlow, borderColor: colors.pink }]}>
          <MaterialCommunityIcons name="bullhorn-outline" size={18} color={colors.pink} />
          <Text style={[styles.adFilterText, { color: colors.textPrimary }]} numberOfLines={1}>
            Showing results from{' '}
            <Text style={{ fontFamily: Fonts.bold, color: colors.pink }}>
              {adFilter.title || 'Sponsored Ad'}
            </Text>
          </Text>
          <Pressable onPress={handleClearAdFilter} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.pink} />
          </Pressable>
        </View>
      )}

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        {(['all', 'products', 'services'] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            style={[
              styles.togglePill,
              { borderColor: colors.cardBorder },
              viewMode === mode && { backgroundColor: colors.pink, borderColor: colors.pink },
            ]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[
              styles.toggleText,
              { color: colors.textSecondary },
              viewMode === mode && { color: '#FFFFFF' },
            ]}>
              {mode === 'all' ? 'All' : mode === 'products' ? 'Products' : 'Services'}
            </Text>
          </Pressable>
        ))}
      </View>

      {!adFilter && (
        <View style={styles.categorySection}>
          <View style={styles.categoryRow}>
            <Pressable
              style={[styles.categoryButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
              onPress={handleOpenCategoryFilter}
            >
              <MaterialCommunityIcons name="filter-variant" size={18} color={colors.textMuted} />
              <Text style={[styles.categoryButtonText, { color: colors.textPrimary }]}>
                {selectedProductCategoryIds.length === 0 && selectedServiceCategoryIds.length === 0
                  ? 'All categories'
                  : `Products: ${selectedProductCategoryIds.length} · Services: ${selectedServiceCategoryIds.length}`}
              </Text>
            </Pressable>
            {(selectedProductCategoryIds.length > 0 || selectedServiceCategoryIds.length > 0) && (
              <Pressable onPress={handleClearCategories} style={styles.clearButton}>
                <Text style={[styles.clearButtonText, { color: colors.pink }]}>Clear</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.results}
        >
          {showProducts && products.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Products:</Text>
              <Text style={[styles.resultCount, { color: colors.textMuted }]}>Showing {products.length} results</Text>
              <View style={styles.productGrid}>
                {products.map((p) => (
                  <View key={p.product_id} style={styles.productGridItem}>
                    <ProductCard
                      name={p.name}
                      price={p.price}
                      imageUrl={p.image_url}
                      vendorName={p.vendor_name}
                      onAddToCart={() => handleAddToCart(p.product_id)}
                      onPress={() => router.push(`/product/${p.product_id}` as any)}
                    />
                  </View>
                ))}
              </View>
            </>
          )}

          {showServices && services.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Services:</Text>
              <Text style={[styles.resultCount, { color: colors.textMuted }]}>Showing {services.length} results</Text>
              {services.map((s) => (
                <ServiceCard
                  key={s.service_id}
                  name={s.name}
                  providerName={s.provider_name}
                  price={s.price}
                  imageUrl={s.image_url}
                  duration={s.duration || undefined}
                />
              ))}
            </>
          )}

          {searched && products.length === 0 && services.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify-close" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No results found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Try a different search term</Text>
            </View>
          )}

          <View style={{ height: androidTabOffset + Spacing.lg }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  results: { paddingHorizontal: Spacing.md, paddingBottom: 20 },

  searchRow: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  searchInput: {
    flex: 1, fontFamily: Fonts.medium,
    fontSize: FontSizes.sm, marginLeft: Spacing.sm, paddingVertical: 0,
  },

  adFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  adFilterText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },

  toggleRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  categorySection: {
    marginBottom: Spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    borderRadius: BorderRadius.lg, borderWidth: 1,
    flex: 1,
  },
  categoryButtonText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
  clearButton: { paddingHorizontal: Spacing.xs, paddingVertical: 6 },
  clearButtonText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, textTransform: 'uppercase' },
  togglePill: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    backgroundColor: 'transparent',
  },
  toggleText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5 },

  sectionTitle: {
    fontFamily: Fonts.extraBold, fontSize: FontSizes.xl,
    marginBottom: 4, marginTop: Spacing.md,
  },
  resultCount: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginBottom: Spacing.lg, opacity: 0.6 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  productGridItem: { width: '50%' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4, opacity: 0.6 },
});
