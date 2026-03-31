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
import { useTheme } from '@/hooks/useTheme';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { CategoryPill } from '@/components';

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

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { colors } = useTheme();
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
        style={[styles.serviceCardGradient, { borderColor: colors.cardBorder }]}
      >
        <Text style={[styles.serviceCardName, { color: colors.textPrimary }]} numberOfLines={2}>{service.name}</Text>
        <Text style={[styles.serviceCardPrice, { color: colors.textSecondary }]}>Starting at {service.price} EGP</Text>
        <View style={styles.serviceCardArrow}>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.pink} />
        </View>
      </LinearGradient>
    </Pressable>
  );

  const renderProductCard = (product: Product) => (
    <Pressable key={product.product_id} style={[styles.productCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
      <View style={[styles.productImage, { backgroundColor: colors.imagePlaceholder }]}>
        <MaterialCommunityIcons name="car-wrench" size={32} color={colors.textMuted} />
      </View>
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>{product.name}</Text>
        <Text style={[styles.productPrice, { color: colors.pink }]}>{product.price} EGP</Text>
        <Pressable onPress={() => handleAddToCart(product.product_id)} style={styles.miniAddBtn}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
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
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.backgroundSecondary, borderColor: colors.pink }]}>
          <MaterialCommunityIcons name="account" size={24} color={colors.pink} />
        </View>
        <View>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>
            Hello, <Text style={[styles.greetingName, { color: colors.pink }]}>{user?.name || 'User'}!</Text>
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <Pressable style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]} onPress={() => router.push('/(tabs)/search')}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search for services, parts...</Text>
      </Pressable>

      {/* Featured Services */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Featured Services</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {services.map(renderServiceCard)}
        {services.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No services yet</Text>
        )}
      </ScrollView>

      {/* Featured Products */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Featured Products</Text>
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
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products yet</Text>
        )}
      </ScrollView>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
      <View style={[styles.activityCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        <View style={[styles.activityIcon, { backgroundColor: colors.pinkGlow }]}>
          <MaterialCommunityIcons name="package-variant" size={20} color={colors.pink} />
        </View>
        <View style={styles.activityInfo}>
          <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Welcome to CarKit!</Text>
          <Text style={[styles.activitySub, { color: colors.textMuted }]}>Browse products and services to get started</Text>
        </View>
      </View>

      <View style={{ height: androidTabOffset + Spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 60 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.sm,
  },
  greeting: { fontFamily: Fonts.semiBold, fontSize: FontSizes.lg },
  greetingName: { fontFamily: Fonts.bold },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.md, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    marginBottom: Spacing.lg,
  },
  searchPlaceholder: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginLeft: Spacing.sm },

  sectionTitle: {
    fontFamily: Fonts.bold, fontSize: FontSizes.lg,
    marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  horizontalScroll: { marginBottom: Spacing.md },
  pillRow: { marginBottom: Spacing.sm },
  emptyText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, paddingHorizontal: Spacing.sm },

  serviceCard: {
    width: 180, height: 150, borderRadius: BorderRadius.lg,
    overflow: 'hidden', marginRight: Spacing.sm,
  },
  serviceCardGradient: {
    flex: 1, padding: Spacing.md,
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  serviceCardName: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  serviceCardPrice: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
  serviceCardArrow: { alignSelf: 'flex-start', marginTop: 4 },

  productCard: {
    width: 160, borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginRight: Spacing.sm, overflow: 'hidden',
  },
  productImage: {
    height: 100, justifyContent: 'center', alignItems: 'center',
  },
  productInfo: { padding: Spacing.sm },
  productName: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, marginBottom: 4 },
  productPrice: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 8 },
  miniAddBtn: { borderRadius: BorderRadius.sm, overflow: 'hidden' },
  miniAddBtnGrad: { paddingVertical: 6, alignItems: 'center', borderRadius: BorderRadius.sm },
  miniAddBtnText: { color: '#FFFFFF', fontFamily: Fonts.semiBold, fontSize: 11 },

  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  activityIcon: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.sm,
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  activitySub: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
});
