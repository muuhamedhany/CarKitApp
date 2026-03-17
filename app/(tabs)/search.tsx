import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import ProductCard from '@/components/ProductCard';
import ServiceCard from '@/components/ServiceCard';
import CategoryPill from '@/components/CategoryPill';

type Product = {
  product_id: number; name: string; price: string; description?: string;
  category_name?: string; vendor_name?: string; stock?: number;
};
type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
};

type ViewMode = 'all' | 'products' | 'services';

export default function SearchScreen() {
  const { token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [prodRes, servRes] = await Promise.all([
        fetch(`${API_URL}/products${query ? `?search=${encodeURIComponent(query)}` : ''}`, { headers }),
        fetch(`${API_URL}/services`, { headers }),
      ]);
      const [prodData, servData] = await Promise.all([prodRes.json(), servRes.json()]);
      if (prodData.success) setProducts(prodData.data || []);
      if (servData.success) {
        let filtered = servData.data || [];
        if (query) {
          const q = query.toLowerCase();
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
  }, [query, token]);

  // Load all on mount
  useEffect(() => { search(); }, []);

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
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products, services..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        {(['products', 'services', 'all'] as ViewMode[]).map((mode) => (
          <Pressable
            key={mode}
            style={[styles.togglePill, viewMode === mode && styles.togglePillActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
              {mode === 'all' ? 'All' : mode === 'products' ? 'Products' : 'Services'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.results}
        >
          {/* Products */}
          {showProducts && products.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Products:</Text>
              <Text style={styles.resultCount}>Showing {products.length} results</Text>
              <View style={styles.productGrid}>
                {products.map((p) => (
                  <View key={p.product_id} style={styles.productGridItem}>
                    <ProductCard
                      name={p.name}
                      price={p.price}
                      vendorName={p.vendor_name}
                      onAddToCart={() => handleAddToCart(p.product_id)}
                    />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Services */}
          {showServices && services.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Services:</Text>
              <Text style={styles.resultCount}>Showing {services.length} results</Text>
              {services.map((s) => (
                <ServiceCard
                  key={s.service_id}
                  name={s.name}
                  providerName={s.provider_name}
                  price={s.price}
                  duration={s.duration || undefined}
                />
              ))}
            </>
          )}

          {/* Empty state */}
          {searched && products.length === 0 && services.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="magnify-close" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No results found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  results: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },

  // Search
  searchRow: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  searchInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  searchInput: {
    flex: 1, color: Colors.textPrimary, fontFamily: Fonts.regular,
    fontSize: FontSizes.sm, marginLeft: Spacing.sm, paddingVertical: 0,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md, gap: Spacing.sm,
  },
  togglePill: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.cardBorder, backgroundColor: 'transparent',
  },
  togglePillActive: { backgroundColor: Colors.pink, borderColor: Colors.pink },
  toggleText: { color: Colors.textSecondary, fontFamily: Fonts.medium, fontSize: FontSizes.xs },
  toggleTextActive: { color: Colors.white },

  // Products
  sectionTitle: {
    color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.xl,
    marginBottom: 4, marginTop: Spacing.sm,
  },
  resultCount: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginBottom: Spacing.sm },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  productGridItem: { width: '50%' },

  // Empty
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: Colors.textPrimary, fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, marginTop: Spacing.md },
  emptySubtitle: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4 },
});
