import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import CategoryPill from '@/components/CategoryPill';
import ProductCard from '@/components/ProductCard';
import ServiceCard from '@/components/ServiceCard';

type Category = { category_id: number; name: string; description?: string };
type ServiceCategory = { service_category_id: number; name: string };
type Product = {
  product_id: number; name: string; description?: string;
  price: string; stock: number; category_name?: string; vendor_name?: string;
};
type Service = {
  service_id: number; name: string; description?: string;
  price: string; duration?: number; category_name?: string; provider_name?: string;
};

const SERVICE_ICONS: Record<string, string> = {
  'Brakes': 'car-brake-parking',
  'Oil Change': 'oil',
  'Tires': 'tire',
  'Engine': 'engine',
  'default': 'wrench',
};

const PRODUCT_ICONS: Record<string, string> = {
  'Batteries': 'car-battery',
  'Body': 'car-door',
  'Engine': 'engine',
  'Brakes': 'car-brake-parking',
  'default': 'car-cog',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceCat, setSelectedServiceCat] = useState<number | null>(null);
  const [selectedProductCat, setSelectedProductCat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [catRes, sCatRes, prodRes, servRes] = await Promise.all([
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/services/categories`),
        fetch(`${API_URL}/products`),
        fetch(`${API_URL}/services`),
      ]);
      const [catData, sCatData, prodData, servData] = await Promise.all([
        catRes.json(), sCatRes.json(), prodRes.json(), servRes.json(),
      ]);
      if (catData.success) setCategories(catData.data);
      if (sCatData.success) setServiceCategories(sCatData.data);
      if (prodData.success) setProducts(prodData.data);
      if (servData.success) setServices(servData.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const filteredProducts = selectedProductCat
    ? products.filter(p => categories.find(c => c.category_id === selectedProductCat)?.name === p.category_name)
    : products;

  const filteredServices = selectedServiceCat
    ? services.filter(s => serviceCategories.find(c => c.service_category_id === selectedServiceCat)?.name === s.category_name)
    : services;

  const handleAddToCart = async (productId: number) => {
    const res = await addToCart(productId);
    if (res.success) {
      showToast('success', 'Added!', 'Product added to cart.');
    } else {
      showToast('error', 'Error', res.message);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.pink} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pink} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account-circle" size={44} color={Colors.pink} />
        </View>
        <View>
          <Text style={styles.greeting}>
            Hello, <Text style={styles.greetingName}>{user?.name || 'Guest'}!</Text>
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Search for services, parts...</Text>
      </Pressable>

      {/* Featured Services */}
      <Text style={styles.sectionTitle}>Featured Services</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        <CategoryPill
          label="All"
          isActive={selectedServiceCat === null}
          onPress={() => setSelectedServiceCat(null)}
        />
        {serviceCategories.map(cat => (
          <CategoryPill
            key={cat.service_category_id}
            label={cat.name}
            icon={SERVICE_ICONS[cat.name] || SERVICE_ICONS.default}
            isActive={selectedServiceCat === cat.service_category_id}
            onPress={() => setSelectedServiceCat(cat.service_category_id)}
          />
        ))}
      </ScrollView>
      {filteredServices.length > 0 ? (
        <FlatList
          horizontal
          data={filteredServices.slice(0, 10)}
          keyExtractor={item => String(item.service_id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.md }}
          renderItem={({ item }) => (
            <ServiceCard
              name={item.name}
              price={item.price}
              duration={item.duration}
              providerName={item.provider_name}
              variant="compact"
            />
          )}
        />
      ) : (
        <View style={styles.emptySection}>
          <MaterialCommunityIcons name="wrench" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No services available yet</Text>
        </View>
      )}

      {/* Featured Products */}
      <Text style={styles.sectionTitle}>Featured Products</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll}>
        <CategoryPill
          label="All"
          isActive={selectedProductCat === null}
          onPress={() => setSelectedProductCat(null)}
        />
        {categories.map(cat => (
          <CategoryPill
            key={cat.category_id}
            label={cat.name}
            icon={PRODUCT_ICONS[cat.name] || PRODUCT_ICONS.default}
            isActive={selectedProductCat === cat.category_id}
            onPress={() => setSelectedProductCat(cat.category_id)}
          />
        ))}
      </ScrollView>
      {filteredProducts.length > 0 ? (
        <FlatList
          horizontal
          data={filteredProducts.slice(0, 10)}
          keyExtractor={item => String(item.product_id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.md }}
          renderItem={({ item }) => (
            <ProductCard
              name={item.name}
              price={item.price}
              onAddToCart={() => handleAddToCart(item.product_id)}
            />
          )}
        />
      ) : (
        <View style={styles.emptySection}>
          <MaterialCommunityIcons name="car-cog" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No products available yet</Text>
        </View>
      )}

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityList}>
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(233,30,140,0.15)' }]}>
            <MaterialCommunityIcons name="package-variant" size={20} color={Colors.pink} />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityText}>Browse products and services</Text>
            <Text style={styles.activityMeta}>Tap Search to get started</Text>
          </View>
        </View>
        <View style={styles.activityItem}>
          <View style={[styles.activityIcon, { backgroundColor: 'rgba(156,39,176,0.15)' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={Colors.purple} />
          </View>
          <View style={styles.activityInfo}>
            <Text style={styles.activityText}>Welcome to CarKit!</Text>
            <Text style={styles.activityMeta}>Your one-stop auto parts & services</Text>
          </View>
        </View>
      </View>

      {/* Bottom spacer for tab bar */}
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 56,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  greeting: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.semiBold,
  },
  greetingName: {
    color: Colors.pink,
    fontFamily: Fonts.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchPlaceholder: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginLeft: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  pillScroll: {
    paddingLeft: Spacing.lg,
    marginBottom: Spacing.md,
  },
  emptySection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginTop: Spacing.sm,
  },
  activityList: {
    paddingHorizontal: Spacing.lg,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
  activityMeta: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
