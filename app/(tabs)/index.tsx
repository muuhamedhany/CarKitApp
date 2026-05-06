import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useWishlist } from '@/contexts/WishlistContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows, Animations } from '@/constants/theme';
import { 
  CategoryPill, 
  ProductCard, 
  ServiceCard, 
  AdSlideshow, 
  HomeSkeleton 
} from '@/components';
import { adService, Ad } from '@/services/api/ad.service';

// ─── Typewriter Search Placeholder ────────────────────────────────────────────
const SEARCH_PHRASES = [
  'Premium engine oils...',
  'High-performance brake pads...',
  'Professional detailing...',
  'Tire rotation experts...',
  'Quick battery replacement...',
  'Advanced AC recharge...',
  'Spark plugs & ignition...',
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
  const { displayed, showCursor } = useTypewriter(SEARCH_PHRASES);
  return (
    <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginLeft: Spacing.sm, color: textColor, flex: 1 }}>
      {displayed}
      <Text style={{ opacity: showCursor ? 1 : 0, color: '#CD42A8' }}>|</Text>
    </Text>
  );
}

// ─── HomeScreen Component ───────────────────────────────────────────────────────
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
  
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 80], [0, 1], Extrapolate.CLAMP);
    return {
      opacity,
      backgroundColor: isDark ? 'rgba(5,5,5,0.85)' : 'rgba(255,255,255,0.85)',
    };
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
          colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
        <HomeSkeleton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { top: SCREEN_HEIGHT * 0.4, left: -150, backgroundColor: colors.purple + '10' }]} />

      {/* Sticky Header Blur */}
      <Animated.View style={[styles.headerBlurContainer, { paddingTop: insets.top }, headerStyle]}>
        <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={styles.headerInner}>
          <Text style={[styles.headerCompactTitle, { color: colors.textPrimary }]}>CarKit</Text>
          <Pressable 
            style={[styles.notificationBtnSmall, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.textPrimary} />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
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
            style={[styles.notificationBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
            <View style={[styles.notificationDot, { backgroundColor: colors.pink }]} />
          </Pressable>
        </Animated.View>

        {/* Search — premium glass design */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)}>
          <Pressable 
            style={({ pressed }) => [
              styles.searchBar, 
              { 
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
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
            <View style={[styles.searchFilterIcon, { backgroundColor: colors.pink + '20' }]}>
               <MaterialCommunityIcons name="tune-variant" size={16} color={colors.pink} />
            </View>
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
              <View key={service.service_id} style={{ width: 290, marginRight: Spacing.md }}>
                <ServiceCard 
                  name={service.name}
                  providerName={service.provider_name}
                  price={service.price}
                  imageUrl={service.image_url}
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
          {productCategories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow} contentContainerStyle={{ paddingLeft: Spacing.md, gap: Spacing.sm }}>
              {productCategories.slice(0, 5).map((cat) => (
                <CategoryPill key={cat.category_id} label={cat.name} />
              ))}
            </ScrollView>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={styles.horizontalScrollContent}>
            {products.map((product) => (
              <View key={product.product_id} style={{ width: 190, marginRight: Spacing.md }}>
                <ProductCard 
                  productId={product.product_id}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.image_url}
                  vendorName={product.vendor_name}
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
            <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
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
              <MaterialCommunityIcons name={"sparkles" as any} size={24} color={colors.pink} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Neon Redesign Live!</Text>
              <Text style={[styles.activitySub, { color: colors.textSecondary }]}>Explore our premium new look across the entire app.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
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
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
  headerBlurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 12,
  },
  headerCompactTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
    letterSpacing: -0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: 10,
  },
  headerLeft: { flex: 1 },
  greetingLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.7 },
  greetingName: { fontFamily: Fonts.extraBold, fontSize: 32, marginTop: -4, letterSpacing: -1 },
  notificationBtn: {
    width: 52, height: 52, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
  },
  notificationBtnSmall: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute', top: 16, right: 16,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5, borderColor: '#050505',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BorderRadius.xl, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    marginBottom: Spacing.xl,
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
    fontFamily: Fonts.extraBold, fontSize: FontSizes.xxl,
    letterSpacing: -1,
  },
  seeAllText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  horizontalScroll: { 
    marginBottom: Spacing.xxl, 
    marginHorizontal: -Spacing.lg,
  },
  horizontalScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 8,
  },
  pillRow: { 
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  promoBanner: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: Spacing.xxl,
    ...Shadows.md,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
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
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
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
