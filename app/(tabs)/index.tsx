import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import CategoryPill from '@/components/CategoryPill';

const TAB_BAR_HEIGHT = 65;

type Category = { category_id: number; name: string; description?: string };
type Product = {
  product_id: number; name: string; price: string; description?: string;
  category_name?: string; vendor_name?: string;
};
type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
};

// Service category icons
const SERVICE_ICONS: Record<string, string> = {
  Brakes: 'car-brake-alert',
  'Oil Change': 'oil',
  Tires: 'tire',
  Engine: 'engine',
  default: 'car-wrench',
};

// Product category icons
const PRODUCT_ICONS: Record<string, string> = {
  Batteries: 'car-battery',
  Body: 'car-door',
  Engine: 'engine',
  default: 'car-cog',
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [prodRes, servRes, catRes] = await Promise.all([
        fetch(`${API_URL}/products`, { headers }),
        fetch(`${API_URL}/services`, { headers }),
        fetch(`${API_URL}/categories`, { headers }),
      ]);
      const [prodData, servData, catData] = await Promise.all([
        prodRes.json(), servRes.json(), catRes.json(),
      ]);
      if (prodData.success) setProducts(prodData.data?.slice(0, 6) || []);
      if (servData.success) setServices(servData.data?.slice(0, 4) || []);
      if (catData.success) setProductCategories(catData.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleAddToCart = async (productId: number) => {
    const result = await addToCart(productId);
    if (result.success) {
      showToast('success', 'Added!', 'Product added to your cart.');
    } else {
      showToast('error', 'Error', result.message);
    }
  };

  const renderServiceCard = (service: Service) => (
    <Pressable key={service.service_id} style={styles.serviceCard}>
      <LinearGradient
        colors={['rgba(156,39,176,0.4)', 'rgba(233,30,140,0.3)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.serviceCardGradient}
      >
        <Text style={styles.serviceCardName} numberOfLines={2}>{service.name}</Text>
        <Text style={styles.serviceCardPrice}>Starting at {service.price} EGP</Text>
        <View style={styles.serviceCardArrow}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.pink} />
        </View>
      </LinearGradient>
    </Pressable>
  );

  const renderProductCard = (product: Product) => (
    <Pressable key={product.product_id} style={styles.productCard}>
      <View style={styles.productImage}>
        <MaterialCommunityIcons name="car-wrench" size={32} color={Colors.textMuted} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productPrice}>{product.price} EGP</Text>
        <Pressable onPress={() => handleAddToCart(product.product_id)} style={styles.miniAddBtn}>
          <LinearGradient
            colors={[Colors.gradientStart, Colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.miniAddBtnGrad}
          >
            <Text style={styles.miniAddBtnText}>Add to Cart</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.pink} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.pink} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={24} color={Colors.pink} />
        </View>
        <View>
          <Text style={styles.greeting}>
            Hello, <Text style={styles.greetingName}>{user?.name || 'User'}!</Text>
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <Pressable style={styles.searchBar} onPress={() => router.push('/(tabs)/search')}>
        <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
        <Text style={styles.searchPlaceholder}>Search for services, parts...</Text>
      </Pressable>

      {/* Featured Services */}
      <Text style={styles.sectionTitle}>Featured Services</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {services.map(renderServiceCard)}
        {services.length === 0 && (
          <Text style={styles.emptyText}>No services yet</Text>
        )}
      </ScrollView>

      {/* Featured Products */}
      <Text style={styles.sectionTitle}>Featured Products</Text>
      {productCategories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
          {productCategories.slice(0, 5).map((cat) => (
            <CategoryPill key={cat.category_id} label={cat.name} />
          ))}
        </ScrollView>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {products.map(renderProductCard)}
        {products.length === 0 && (
          <Text style={styles.emptyText}>No products yet</Text>
        )}
      </ScrollView>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <View style={styles.activityCard}>
        <View style={styles.activityIcon}>
          <MaterialCommunityIcons name="package-variant" size={20} color={Colors.pink} />
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.activityTitle}>Welcome to CarKit!</Text>
          <Text style={styles.activitySub}>Browse products and services to get started</Text>
        </View>
      </View>

      <View style={{ height: androidTabOffset + Spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 60 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2, borderColor: Colors.pink,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.sm,
  },
  greeting: { color: Colors.textPrimary, fontFamily: Fonts.semiBold, fontSize: FontSizes.lg },
  greetingName: { color: Colors.pink, fontFamily: Fonts.bold },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    marginBottom: Spacing.lg,
  },
  searchPlaceholder: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginLeft: Spacing.sm },

  // Section
  sectionTitle: {
    color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.lg,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  horizontalScroll: { marginBottom: Spacing.md },
  pillRow: { marginBottom: Spacing.sm },
  emptyText: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm, paddingHorizontal: Spacing.sm },

  // Service Card
  serviceCard: {
    width: 180, height: 150, borderRadius: BorderRadius.lg,
    overflow: 'hidden', marginRight: Spacing.sm,
  },
  serviceCardGradient: {
    flex: 1, padding: Spacing.md,
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  serviceCardName: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.md },
  serviceCardPrice: { color: Colors.textSecondary, fontFamily: Fonts.regular, fontSize: FontSizes.xs },
  serviceCardArrow: {
    alignSelf: 'flex-start', marginTop: 4,
  },

  // Product Card
  productCard: {
    width: 160, borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.cardBorder,
    marginRight: Spacing.sm, overflow: 'hidden',
  },
  productImage: {
    height: 100, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(30,20,50,0.5)',
  },
  productInfo: { padding: Spacing.sm },
  productName: { color: Colors.textPrimary, fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: 4 },
  productPrice: { color: Colors.pink, fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 8 },
  miniAddBtn: { borderRadius: BorderRadius.sm, overflow: 'hidden' },
  miniAddBtnGrad: { paddingVertical: 6, alignItems: 'center', borderRadius: BorderRadius.sm },
  miniAddBtnText: { color: Colors.white, fontFamily: Fonts.semiBold, fontSize: 11 },

  // Activity
  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(233,30,140,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.sm,
  },
  activityInfo: { flex: 1 },
  activityTitle: { color: Colors.textPrimary, fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  activitySub: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
});
