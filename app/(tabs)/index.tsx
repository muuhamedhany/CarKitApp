import {
  AdSlideshow,
  GlassView,
  HomeSkeleton,
  ProductCard,
  ServiceCard
} from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing, Colors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { useTabReload } from '@/hooks/useTabReload';
import { useTheme } from '@/hooks/useTheme';
import { Ad, adService } from '@/services/api/ad.service';
import { notificationService } from '@/services/api/notification.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Typewriter Search Placeholder ────────────────────────────────────────────
const SEARCH_PHRASES = [
  'Premium engine oils...',
  'Professional detailing...',
  'Tire rotation experts...',
  'Quick battery replacement...',
  'Advanced AC recharge...',
  'Best oil change nearby...',
];

function useTypewriter(phrases: string[]) {
  const [displayed, setDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const phraseIdx = useRef(0);
  const charIdx = useRef(0);
  const isErasing = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cursor = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(cursor);
  }, []);

  useEffect(() => {
    const tick = () => {
      const phrase = phrases[phraseIdx.current];
      if (!isErasing.current) {
        if (charIdx.current < phrase.length) {
          charIdx.current++;
          setDisplayed(phrase.slice(0, charIdx.current));
          timeoutRef.current = setTimeout(tick, 60);
        } else {
          isErasing.current = true;
          timeoutRef.current = setTimeout(tick, 2000);
        }
      } else {
        if (charIdx.current > 0) {
          charIdx.current--;
          setDisplayed(phrase.slice(0, charIdx.current));
          timeoutRef.current = setTimeout(tick, 30);
        } else {
          isErasing.current = false;
          phraseIdx.current = (phraseIdx.current + 1) % phrases.length;
          timeoutRef.current = setTimeout(tick, 500);
        }
      }
    };
    timeoutRef.current = setTimeout(tick, 500);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [phrases]);

  return { displayed, showCursor };
}

function TypewriterSearchBar({ textColor }: { textColor: string }) {
  const { colors } = useTheme();
  const { displayed, showCursor } = useTypewriter(SEARCH_PHRASES);
  return (
    <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginLeft: Spacing.sm, color: textColor, flex: 1 }}>
      {displayed}
      <Text style={{ opacity: showCursor ? 1 : 0, color: colors?.pink || '#CD42A8' }}>|</Text>
    </Text>
  );
}

// ─── HomeScreen Component ───────────────────────────────────────────────────────
type Category = { category_id: number; name: string; description?: string };
type Product = {
  product_id: number; name: string; price: string; description?: string;
  category_name?: string; vendor_name?: string;
  image_url?: string | null;
  rating?: number;
  review_count?: number;
};
type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
  image_url?: string | null;
  rating?: number;
  review_count?: number;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 90;

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [activeAds, setActiveAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);

  useTabReload('index', () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    onRefresh();
  });

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });



  const fetchData = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [prodRes, servRes, catRes] = await Promise.all([
        fetch(`${API_URL}/products?page=1&pageSize=6`, { headers }),
        fetch(`${API_URL}/services?page=1&pageSize=4`, { headers }),
        fetch(`${API_URL}/categories`, { headers }),
      ]);
      const [prodData, servData, catData] = await Promise.all([
        prodRes.json(), servRes.json(), catRes.json(),
      ]);
      if (prodData.success) setProducts(prodData.data || []);
      if (servData.success) setServices(servData.data || []);
      if (catData.success) setProductCategories(catData.data || []);

      try {
        const adsRes = await adService.getActiveAds();
        if (adsRes.success && adsRes.data) setActiveAds(adsRes.data);
      } catch { /* non-blocking */ }

      try {
        const unreadRes = await notificationService.getUnreadCount();
        if (unreadRes.success && unreadRes.data) {
          setUnreadCount(unreadRes.data.count);
        }
      } catch { /* non-blocking */ }
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', 'Added!', 'Product added to your cart.');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Error', result.message);
    }
  };

  const handleAdPress = (ad: Ad) => {
    const searchParams: Record<string, string> = {};
    if (ad.vendor_id) {
      searchParams.vendor_id = String(ad.vendor_id);
      searchParams.type = 'products';
    } else if (ad.provider_id) {
      searchParams.provider_id = String(ad.provider_id);
      searchParams.type = 'services';
    }
    if (ad.advertiser_name) searchParams.ad_title = ad.advertiser_name;
    router.push({ pathname: '/(tabs)/search' as any, params: searchParams });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.bgGradientStart, colors.bgGradientEnd]}
          style={StyleSheet.absoluteFill}
        />
        <HomeSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { top: SCREEN_HEIGHT * 0.4, left: -150, backgroundColor: colors.purple + '10' }]} />

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} />}
      >
        {/* Main Header */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingLabel, { color: colors.textSecondary }]}>Welcome back,</Text>
            <Text style={[styles.greetingName, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'Member'}</Text>
          </View>
          <Pressable
            style={[styles.notificationBtn, { backgroundColor: colors.glass, borderColor: colors.cardBorder }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications');
            }}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
            {unreadCount > 0 ? (
              <View style={[styles.notificationCircleIndicator, { backgroundColor: colors.pink }]} />
            ) : ("")}
          </Pressable>
        </Animated.View>

        {/* Search */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
          <Pressable
            style={({ pressed }) => [
              styles.searchBar,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(tabs)/search');
            }}
          >
            <MaterialCommunityIcons name="magnify" size={22} color={colors.pink} />
            <TypewriterSearchBar textColor={colors.textSecondary} />

          </Pressable>
        </Animated.View>

        {/* Sponsored Ads */}
        {activeAds.length > 0 && (
          <Animated.View entering={FadeInDown.delay(500).duration(800)}>
            <AdSlideshow ads={activeAds} onAdPress={handleAdPress} />
          </Animated.View>
        )}

        {/* Featured Services */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Featured Services</Text>
            <Pressable onPress={() => router.push('/(tabs)/search?type=services')}>
              <Text style={[styles.seeAllText, { color: colors.pink }]}>See All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
            {services.map((service) => (
              <View key={service.service_id} style={{ width: 290, marginRight: Spacing.sm }}>
                <ServiceCard
                  name={service.name}
                  providerName={service.provider_name}
                  price={service.price}
                  imageUrl={service.image_url}
                  rating={service.rating}
                  reviewCount={service.review_count}
                  onView={() => router.push(`/service/${service.service_id}`)}
                  onBookNow={() => router.push(`/service/${service.service_id}`)}
                />
              </View>
            ))}
            {services.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No services yet</Text>
            )}
          </ScrollView>
        </Animated.View>

        {/* Featured Products */}
        <Animated.View entering={FadeInDown.delay(700).duration(800)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shop Parts</Text>
            <Pressable onPress={() => router.push('/(tabs)/search?type=products')}>
              <Text style={[styles.seeAllText, { color: colors.pink }]}>See All</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
            {products.map((product) => (
              <View key={product.product_id} style={{ width: 190, marginRight: Spacing.xs }}>
                <ProductCard
                  productId={product.product_id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.image_url}
                  vendorName={product.vendor_name}
                  rating={product.rating}
                  reviewCount={product.review_count}
                  onPress={() => router.push(`/product/${product.product_id}`)}
                  onAddToCart={() => handleAddToCart(product.product_id)}
                />
              </View>
            ))}
            {products.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products yet</Text>
            )}
          </ScrollView>
        </Animated.View>

        {/* Promotional Banner — modernized glass design */}
        <Animated.View entering={FadeInDown.delay(800).duration(800)}>
          <Pressable
            style={[
              styles.promoBanner,
              {
                backgroundColor: isDark ? 'rgba(205, 66, 168, 0.1)' : 'rgba(205, 66, 168, 0.03)',
                borderColor: colors.pink + '40'
              }
            ]}
          >
            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={styles.promoContent}>
              <View style={styles.promoTextGroup}>
                <Text style={[styles.promoTitle, { color: colors.textPrimary }]}>20% OFF FIRST SERVICE</Text>
                <Text style={[styles.promoSub, { color: colors.pink }]}>Use code: CARKITNEON</Text>
              </View>
              <View style={[styles.promoIconContainer, { backgroundColor: colors.pink + '20' }]}>
                <MaterialCommunityIcons name="ticket-percent" size={28} color={colors.pink} />
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(900).duration(800)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.md }]}>Updates</Text>
          <Pressable
            style={({ pressed }) => [
              styles.activityCard,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <View style={[styles.activityIcon, { backgroundColor: colors.pink + '20' }]}>
              <MaterialCommunityIcons name="alert-decagram-outline" size={24} color={colors.pink} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Neon Redesign Live!</Text>
              <Text style={[styles.activitySub, { color: colors.textSecondary }]}>Explore our premium new look across the entire app.</Text>
            </View>
          </Pressable>
        </Animated.View>

        <View style={{ height: androidTabOffset + Spacing.xl * 2 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.6,
  },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.md, paddingBottom: 60 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: 10,
  },
  headerLeft: { flex: 1 },
  greetingLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.7 },
  greetingName: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl, marginTop: -4, letterSpacing: -1 },
  notificationBtn: {
    width: 52, height: 52, borderRadius: BorderRadius.full,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  notificationBtnSmall: {
    width: 40, height: 40, borderRadius: BorderRadius.full,
    justifyContent: 'center', alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute', top: 16, right: 16,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#050505',
  },
  notificationCircleIndicator: {
    width: 10, height: 10, borderRadius: 999, borderColor: 'white', borderWidth: 1.3, position: "absolute", top: 15, right: 15, zIndex: 10
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.xl, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  searchFilterIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  horizontalScroll: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.lg,
  },
  horizontalScrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  pillRow: {
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  promoBanner: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadows.md,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  promoTextGroup: { flex: 1 },
  promoTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  promoSub: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    letterSpacing: 0.5,
  },
  promoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.sm,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2 },
  activitySub: { fontFamily: Fonts.medium, fontSize: 13, opacity: 0.8 },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginTop: Spacing.xl,
    opacity: 0.5,
  },
});

