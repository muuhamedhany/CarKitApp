import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, Pressable,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import ProductCard from '@/components/ProductCard';
import ServiceCard from '@/components/ServiceCard';
import CategoryPill from '@/components/CategoryPill';

type Product = {
  product_id: number; name: string; description?: string;
  price: string; stock: number; category_name?: string; vendor_name?: string;
};
type Service = {
  service_id: number; name: string; description?: string;
  price: string; duration?: number; category_name?: string; provider_name?: string;
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
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const [prodRes, servRes] = await Promise.all([
        fetch(`${API_URL}/products${q ? `?search=${encodeURIComponent(q)}` : ''}`),
        fetch(`${API_URL}/services`),
      ]);
      const [prodData, servData] = await Promise.all([prodRes.json(), servRes.json()]);
      if (prodData.success) setProducts(prodData.data);
      if (servData.success) {
        // client-side filter for services
        if (q) {
          setServices(servData.data.filter((s: Service) =>
            s.name.toLowerCase().includes(q.toLowerCase())
          ));
        } else {
          setServices(servData.data);
        }
      }
    } catch {
      showToast('error', 'Error', 'Could not load results.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Load all on first render
  useEffect(() => { search(''); }, []);

  const handleSearch = () => { search(query.trim()); };

  const handleAddToCart = async (productId: number) => {
    const res = await addToCart(productId);
    if (res.success) {
      showToast('success', 'Added!', 'Product added to cart.');
    } else {
      showToast('error', 'Error', res.message);
    }
  };

  const showProducts = viewMode === 'all' || viewMode === 'products';
  const showServices = viewMode === 'all' || viewMode === 'services';

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for parts, services..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); search(''); }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.toggleRow}>
        {(['products', 'services', 'all'] as ViewMode[]).map(mode => (
          <Pressable
            key={mode}
            style={[styles.togglePill, viewMode === mode && styles.togglePillActive]}
            onPress={() => setViewMode(mode)}
          >
            <Text style={[styles.toggleText, viewMode === mode && styles.toggleTextActive]}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : (
        <ScrollView
          style={styles.results}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Products Section */}
          {showProducts && (
            <>
              <Text style={styles.sectionTitle}>Products:</Text>
              {products.length > 0 ? (
                <>
                  <Text style={styles.resultCount}>
                    Showing {products.length} result{products.length !== 1 ? 's' : ''}
                  </Text>
                  <View style={styles.productGrid}>
                    {products.map(item => (
                      <View key={item.product_id} style={styles.gridItem}>
                        <ProductCard
                          name={item.name}
                          price={item.price}
                          onAddToCart={() => handleAddToCart(item.product_id)}
                          fullWidth
                        />
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text style={styles.noResults}>No products found</Text>
              )}
            </>
          )}

          {/* Services Section */}
          {showServices && (
            <>
              <Text style={styles.sectionTitle}>Services:</Text>
              {services.length > 0 ? (
                <>
                  <Text style={styles.resultCount}>
                    Showing {services.length} result{services.length !== 1 ? 's' : ''}
                  </Text>
                  {services.map(item => (
                    <View key={item.service_id} style={{ paddingHorizontal: Spacing.lg }}>
                      <ServiceCard
                        name={item.name}
                        providerName={item.provider_name}
                        price={item.price}
                        duration={item.duration}
                        variant="full"
                      />
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noResults}>No services found</Text>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginLeft: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 8,
  },
  togglePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  togglePillActive: {
    backgroundColor: Colors.pink,
    borderColor: Colors.pink,
  },
  toggleText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.semiBold,
  },
  toggleTextActive: {
    color: Colors.white,
  },
  results: {
    flex: 1,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: FontSizes.xl,
    fontFamily: Fonts.bold,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  resultCount: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
  },
  gridItem: {
    width: '50%',
    paddingHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  noResults: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
});
