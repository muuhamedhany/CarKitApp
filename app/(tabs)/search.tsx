import { useState, useEffect, useCallback } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { ProductCard, ServiceCard, CategoryPill } from '@/components';
import { Category, Product } from '@/types/api.types';

const TAB_BAR_HEIGHT = 65;

type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
  image_url?: string | null;
};

type ViewMode = 'all' | 'products' | 'services';

export default function SearchScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (searchQuery: string, categoryId: number | null) => {
    setLoading(true);
    setSearched(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (categoryId) params.set('category_id', String(categoryId));

      const [prodRes, servRes] = await Promise.all([
        fetch(`${API_URL}/products${params.toString() ? `?${params.toString()}` : ''}`, { headers }),
        fetch(`${API_URL}/services`, { headers }),
      ]);
      const [prodData, servData] = await Promise.all([prodRes.json(), servRes.json()]);
      if (prodData.success) setProducts(prodData.data || []);
      if (servData.success) {
        let filtered = servData.data || [];
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter((s: Service) =>
            s.name.toLowerCase().includes(q) ||
            s.provider_name?.toLowerCase().includes(q)
          );
        }
        setServices(filtered);
      }
    } catch {
      showToast('error', 'Error', 'Could not fetch results.');
    } finally {
      setLoading(false);
    }
  }, [showToast, token]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch {
        // Category filtering remains optional if the category endpoint fails.
      }
    };

    loadCategories();
    search('', null);
  }, [search]);

  const handleCategoryPress = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    search(query, categoryId);
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
        <View style={[styles.searchInputContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search products, services..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search(query, selectedCategoryId)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => {
                setQuery('');
                search('', selectedCategoryId);
              }}
            >
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        {(['products', 'services', 'all'] as ViewMode[]).map((mode) => (
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

      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          <CategoryPill
            label="All"
            isActive={selectedCategoryId === null}
            onPress={() => handleCategoryPress(null)}
          />
          {categories.map((category) => (
            <CategoryPill
              key={category.category_id}
              label={category.name}
              isActive={selectedCategoryId === category.category_id}
              onPress={() => handleCategoryPress(category.category_id)}
            />
          ))}
        </ScrollView>
      </View>

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
  results: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },

  searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  searchInput: {
    flex: 1, fontFamily: Fonts.medium,
    fontSize: FontSizes.sm, marginLeft: Spacing.sm, paddingVertical: 0,
  },

  toggleRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl, gap: Spacing.sm,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryRow: {
    paddingHorizontal: Spacing.lg,
  },
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
