import { useState, useEffect, useRef, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { CategoryPill } from '@/components';

const TAB_BAR_HEIGHT = 65;

// ─── Typewriter Search Placeholder ────────────────────────────────────────────
const SEARCH_PHRASES = [
  'Engine oil & filters...',
  'Brake pads & rotors...',
  'Car wash & detailing...',
  'Tire rotation & balance...',
  'Battery replacement...',
  'AC service & recharge...',
  'Spark plugs & ignition...',
  'Oil change near you...',
  'Suspension & steering...',
  'Windshield wipers...',
];

const TYPING_SPEED = 60;    // ms per character typed
const ERASING_SPEED = 30;   // ms per character erased
const PAUSE_AFTER_TYPE = 1800; // ms to hold the full phrase
const PAUSE_AFTER_ERASE = 300; // ms before starting the next phrase

function useTypewriter(phrases: string[]) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);
  const isErasing = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Blinking cursor
  useEffect(() => {
    const cursor = setInterval(() => setShowCursor(v => !v), 500);
    return () => clearInterval(cursor);
  }, []);

  useEffect(() => {
    const tick = () => {
      const phrase = phrases[phraseIdx.current];

      if (!isErasing.current) {
        // Typing forward
        if (charIdx.current < phrase.length) {
          charIdx.current++;
          setDisplayed(phrase.slice(0, charIdx.current));
          timeoutRef.current = setTimeout(tick, TYPING_SPEED);
        } else {
          // Pause at full phrase, then start erasing
          isErasing.current = true;
          timeoutRef.current = setTimeout(tick, PAUSE_AFTER_TYPE);
        }
      } else {
        // Erasing backward
        if (charIdx.current > 0) {
          charIdx.current--;
          setDisplayed(phrase.slice(0, charIdx.current));
          timeoutRef.current = setTimeout(tick, ERASING_SPEED);
        } else {
          // Move to next phrase
          isErasing.current = false;
          phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
          timeoutRef.current = setTimeout(tick, PAUSE_AFTER_ERASE);
        }
      }
    };

    timeoutRef.current = setTimeout(tick, PAUSE_AFTER_ERASE);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phrases]);

  return { displayed, showCursor };
}

function TypewriterSearchBar({ textColor }: { textColor: string }) {
  const { displayed, showCursor } = useTypewriter(SEARCH_PHRASES);
  return (
    <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginLeft: Spacing.sm, color: textColor, flex: 1 }}>
      {displayed}
      <Text style={{ opacity: showCursor ? 1 : 0 }}>|</Text>
    </Text>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

type Category = { category_id: number; name: string; description?: string };
type Product = {
  product_id: number; name: string; price: string; description?: string;
  category_name?: string; vendor_name?: string;
  image_url?: string | null;
};
type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
  image_url?: string | null;
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

  const renderServiceCard = (service: Service) => {
    const hasImage = !!service.image_url;
    return (
      <Pressable key={service.service_id} style={[styles.serviceCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        {/* Image or gradient placeholder */}
        <View style={[styles.serviceCardImage, { backgroundColor: colors.imagePlaceholder }]}>
          {hasImage ? (
            <Image
              source={{ uri: service.image_url! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons name="car-wash" size={28} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.serviceCardContent}>
          <Text style={[styles.serviceCardName, { color: colors.textPrimary }]} numberOfLines={2}>{service.name}</Text>
          <View>
            <Text style={[styles.serviceCardPrice, { color: colors.textPrimary }]}>Starting at {service.price} EGP</Text>
            <View style={styles.serviceCardArrow}>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textPrimary} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderProductCard = (product: Product) => {
    const hasImage = !!product.image_url;
    return (
      <Pressable
        key={product.product_id}
        style={[styles.productCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
        onPress={() => router.push(`/product/${product.product_id}`)}
      >
        <View style={[styles.productImage, { backgroundColor: colors.imagePlaceholder }]}>
          {hasImage ? (
            <Image
              source={{ uri: product.image_url! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons name="car-cog" size={32} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>{product.name}</Text>
          <View style={styles.productMeta}>
            <Text style={[styles.productPrice, { color: colors.textPrimary }]}>{product.price} EGP</Text>
            <Pressable onPress={() => handleAddToCart(product.product_id)} style={styles.addIconBtn}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.pink} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  };

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
      <View style={[styles.header, { marginTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greetingLabel, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.greetingName, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'Member'}</Text>
        </View>
        <Pressable style={[styles.notificationBtn, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
          <View style={[styles.notificationDot, { backgroundColor: colors.pink }]} />
        </Pressable>
      </View>

      {/* Quick Search — typewriter placeholder */}
      <Pressable style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]} onPress={() => router.push('/(tabs)/search')}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
        <TypewriterSearchBar textColor={colors.textMuted} />
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
  content: { paddingHorizontal: Spacing.md, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: 10,
  },
  headerLeft: { flex: 1 },
  greetingLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, opacity: 0.8 },
  greetingName: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl, marginTop: -4 },
  notificationBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute', top: 12, right: 12,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 2, borderColor: '#050505',
  },

  statusCardContainer: { marginBottom: Spacing.xl },
  statusCard: {
    borderRadius: 24, borderWidth: 1,
    overflow: 'hidden', padding: Spacing.lg,
  },
  statusGradient: { ...StyleSheet.absoluteFillObject },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  carName: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
  carStatus: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2 },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1 },
  statValue: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
  statUnit: { fontSize: FontSizes.sm, fontFamily: Fonts.medium, opacity: 0.6 },
  statLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: Spacing.lg },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    marginBottom: Spacing.xl,
  },
  searchPlaceholder: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginLeft: Spacing.sm },

  sectionTitle: {
    fontFamily: Fonts.extraBold, fontSize: FontSizes.lg,
    marginBottom: Spacing.md, letterSpacing: -0.5,
  },
  horizontalScroll: { marginBottom: Spacing.xl, marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg },
  pillRow: { marginBottom: Spacing.md },
  emptyText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },

  serviceCard: {
    width: 200, borderRadius: 20,
    borderWidth: 1, marginRight: Spacing.md,
    overflow: 'hidden',
  },
  serviceCardImage: {
    height: 90, width: '100%',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  serviceCardContent: {
    padding: Spacing.sm,
    justifyContent: 'space-between',
    flex: 1,
  },
  serviceCardName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, lineHeight: 18 },
  serviceCardPrice: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, opacity: 0.8 },
  serviceCardArrow: { alignSelf: 'flex-start', marginTop: 4 },

  productCard: {
    width: 170, borderRadius: 20,
    borderWidth: 1, marginRight: Spacing.md,
    overflow: 'hidden',
  },
  productImage: { height: 110, justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: Spacing.md },
  productName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 2 },
  productMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  addIconBtn: { padding: 4 },

  activityCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  activityIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
  activitySub: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2, opacity: 0.7 },
});
