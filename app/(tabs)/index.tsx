import {
  AdSlideshow,
  GlassView,
  HomeSkeleton,
  ProductCard,
  ServiceCard
} from '@/components';
import { API_URL } from '@/constants/config';
import { BorderRadius,
  FontSizes,
  Fonts,
  Shadows,
  Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTabReload } from '@/hooks/useTabReload';
import { useTheme } from '@/hooks/useTheme';
import { Ad,
  adService } from '@/services/api/ad.service';
import { bookingService } from '@/services/api/booking.service';
import { notificationService } from '@/services/api/notification.service';
import { orderService } from '@/services/api/order.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedScrollHandler,
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { arrowForward, rowDirection, textAlign } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';

// ─── Typewriter Search Placeholder ────────────────────────────────────────────
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

function TypewriterSearchBar({ textColor, phrases }: { textColor: string; phrases: string[] }) {
  const { colors } = useTheme();
  const { displayed, showCursor } = useTypewriter(phrases);
  return (
    <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginLeft: Spacing.sm, color: textColor, flex: 1 }}>
      {displayed}
      <Text style={{ opacity: showCursor ? 1 : 0, color: colors?.pink || '#CD42A8' }}>|</Text>
    </Text>
  );
}

// ─── HomeScreen Component ───────────────────────────────────────────────────────
type Product = {
  product_id: number; name: string; price: string; description?: string;
  category_name?: string; vendor_name?: string;
  image_url?: string | null;
  rating?: number;
  review_count?: number;
  stock: number;
};
type Service = {
  service_id: number; name: string; price: string; duration?: number;
  category_name?: string; provider_name?: string;
  image_url?: string | null;
  rating?: number;
  review_count?: number;
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 90;

export default function HomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { addToCart, items: cartItems } = useCart();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;

  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [activeAds, setActiveAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const searchPhrases = useMemo(() => [
    t('home.search.premiumOils'),
    t('home.search.detailing'),
    t('home.search.tireRotation'),
    t('home.search.battery'),
    t('home.search.ac'),
    t('home.search.oilChange'),
  ], [t]);

  const [latestUpdate, setLatestUpdate] = useState<{
    title: string;
    description: string;
    icon: string;
    route: any;
    color: string;
  } | null>(null);

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

      const [prodRes, servRes] = await Promise.all([
        fetch(`${API_URL}/products?page=1&pageSize=50`, { headers }),
        fetch(`${API_URL}/services?page=1&pageSize=30`, { headers }),
      ]);
      const [prodData, servData] = await Promise.all([
        prodRes.json(), servRes.json(),
      ]);

      let prodList = prodData.data || [];
      let servList = servData.data || [];

      // Dynamic Shuffling: shuffle items randomly and pick a subset to render
      prodList = [...prodList].sort(() => Math.random() - 0.5).slice(0, 6);
      servList = [...servList].sort(() => Math.random() - 0.5).slice(0, 4);

      if (prodData.success) setProducts(prodList);
      if (servData.success) setServices(servList);

      try {
        const adsRes = await adService.getActiveAds();
        if (adsRes.success && adsRes.data) setActiveAds(adsRes.data);
      } catch { /* non-blocking */ }

      // Fetch Latest Activity for Updates section
      if (token) {
        try {
          const [bookingsRes, ordersRes, unreadRes] = await Promise.all([
            bookingService.getMyBookings(undefined, 1, 1),
            orderService.getMyOrders(undefined, 1, 1),
            notificationService.getUnreadCount()
          ]);

          if (unreadRes.success && unreadRes.data) {
            setUnreadCount(unreadRes.data.count);
          }

          let latest: any = null;
          let updateType: 'booking' | 'order' | null = null;

          const booking = bookingsRes.success && bookingsRes.data?.[0];
          const order = ordersRes.success && ordersRes.data?.[0];

          if (booking && order) {
            if (new Date(booking.booking_date) > new Date(order.order_date)) {
              latest = booking;
              updateType = 'booking';
            } else {
              latest = order;
              updateType = 'order';
            }
          } else if (booking) {
            latest = booking;
            updateType = 'booking';
          } else if (order) {
            latest = order;
            updateType = 'order';
          }

          if (updateType === 'booking') {
            const status = latest.status.charAt(0).toUpperCase() + latest.status.slice(1);
            setLatestUpdate({
              title: t('home.bookingStatusTitle', { status }),
              description: t('home.bookingStatusDescription', { serviceName: latest.service_name, status: latest.status.toLowerCase() }),
              icon: 'calendar-check',
              route: '/my-bookings',
              color: colors.pink,
            });
          } else if (updateType === 'order') {
            const status = latest.status.charAt(0).toUpperCase() + latest.status.slice(1);
            setLatestUpdate({
              title: t('home.orderStatusTitle', { status }),
              description: t('home.orderStatusDescription', { orderId: latest.order_id, status: latest.status.toLowerCase() }),
              icon: 'package-variant-closed',
              route: '/my-orders',
              color: colors.purple || '#8B5CF6',
            });
          } else {
            setLatestUpdate({
              title: t('home.redesignTitle'),
              description: t('home.redesignDescription'),
              icon: 'alert-decagram-outline',
              route: '/notifications',
              color: colors.pink,
            });
          }
        } catch { /* non-blocking */ }
      } else {
        setLatestUpdate({
          title: t('home.redesignTitle'),
          description: t('home.redesignDescription'),
          icon: 'alert-decagram-outline',
          route: '/notifications',
          color: colors.pink,
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [colors.pink, colors.purple, t, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleAddToCart = async (productId: number) => {
    const product = products.find(p => p.product_id === productId);
    if (product) {
      const itemInCart = cartItems.find(i => i.product_id_fk === productId);
      if (itemInCart && itemInCart.quantity >= (product.stock || 0)) {
        showToast('warning', t('home.limitReached'), t('home.stockLimitMessage', { stock: product.stock }));
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await addToCart(productId);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', t('home.addedTitle'), t('home.productAdded'));
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', t('common.error'), result.message);
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

      {isDark && (
        <>
          <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
          <View style={[styles.orb, { top: SCREEN_HEIGHT * 0.4, left: -150, backgroundColor: colors.purple + '10' }]} />
        </>
      )}

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.pink}
            colors={[colors.pink]}
            progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'}
          />
        }
      >
        {/* Main Header */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)} style={[styles.header, { flexDirection: rowDirection(isRTL) }]}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingLabel, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>{t('home.welcomeBack')}</Text>
            <Text style={[styles.greetingName, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{user?.name?.split(' ')[0] || t('home.member')}</Text>
          </View>
          <Pressable
            style={[styles.notificationBtn, { backgroundColor: colors.glass, borderColor: colors.cardBorder }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications');
            }}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={[styles.notificationCircleIndicator, { backgroundColor: colors.pink }]} />
            )}
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
            <TypewriterSearchBar textColor={colors.textSecondary} phrases={searchPhrases} />

          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(800)}>
          <Pressable
            style={({ pressed }) => [styles.emergencyButton, { flexDirection: rowDirection(isRTL), opacity: pressed ? 0.9 : 1 }]}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              router.push('/emergency-services' as any);
            }}
          >
            <LinearGradient
              colors={isDark ? ['#E61E1E', '#A00D0D'] : ['#DC2626', '#9E1A1A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Ambient subtle light flare */}
            <View style={styles.emergencyGlowOrb} />

            <View style={styles.emergencyIconContainer}>
              <LinearGradient
                colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.02)']}
                style={StyleSheet.absoluteFill}
              />
              <MaterialCommunityIcons name="car-emergency" size={28} color="#FFFFFF" />
            </View>

            <View style={styles.emergencyTextGroup}>
              <View style={styles.emergencyBadgeRow}>
                <View style={styles.emergencyLiveDot} />
                <Text style={styles.emergencyLiveText}>{t('home.roadsideRescue')}</Text>
              </View>
              <Text style={[styles.emergencyTitle, { textAlign: textAlign(isRTL) }]}>{t('home.emergencyHelp')}</Text>
              <Text style={[styles.emergencySub, { textAlign: textAlign(isRTL) }]}>{t('home.emergencySub')}</Text>
            </View>

            <View style={styles.emergencyArrowCircle}>
              <MaterialCommunityIcons name={arrowForward(isRTL) as any} size={22} color={isDark ? '#E61E1E' : '#DC2626'} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Sponsored Ads */}
        {activeAds.length > 0 && (
          <Animated.View entering={FadeInDown.delay(560).duration(800)}>
            <AdSlideshow ads={activeAds} onAdPress={handleAdPress} />
          </Animated.View>
        )}

        {/* Featured Services */}
        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('home.featuredServices')}</Text>
            <Pressable onPress={() => router.push('/(tabs)/search?type=services')}>
              <Text style={[styles.seeAllText, { color: colors.pink }]}>{t('home.seeAll')}</Text>
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
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noServices')}</Text>
            )}
          </ScrollView>
        </Animated.View>

        {/* Featured Products */}
        <Animated.View entering={FadeInDown.delay(700).duration(800)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('home.shopParts')}</Text>
            <Pressable onPress={() => router.push('/(tabs)/search?type=products')}>
              <Text style={[styles.seeAllText, { color: colors.pink }]}>{t('home.seeAll')}</Text>
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
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('home.noProducts')}</Text>
            )}
          </ScrollView>
        </Animated.View>

        {/* Promotional Banner — modernized glass design */}
        <Animated.View entering={FadeInDown.delay(800).duration(800)}>
          <Pressable
            style={({ pressed }) => [
              styles.promoBanner,
              {
                borderColor: colors.accentBorder,
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#FFFFFF',
                opacity: pressed ? 0.92 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={[colors.pink + '22', colors.purple + '12']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoGradient}
            >
              <View style={[styles.promoContent, { flexDirection: rowDirection(isRTL) }]}>
                <View style={styles.promoTextGroup}>
                  <View style={[styles.promoBadge, { backgroundColor: colors.pink, shadowColor: colors.pink }]}>
                    <Text style={styles.promoBadgeText}>{t('home.specialOffer')}</Text>
                  </View>
                  <Text style={[styles.promoTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('home.freeShipping')}</Text>
                  <Text style={[styles.promoSub, { color: colors.textSecondary }]}>
                    {t('home.freeShippingSub')}
                  </Text>
                </View>
                <View style={[styles.promoIconOuter, { borderColor: colors.pink + '30', backgroundColor: colors.pink + '15', shadowColor: colors.pink }]}>
                  <LinearGradient
                    colors={[colors.pink, colors.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.promoIconInner}
                  >
                    <MaterialCommunityIcons name="truck-delivery" size={26} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(900).duration(800)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.lg, marginBottom: Spacing.md, textAlign: textAlign(isRTL) }]}>{t('home.updates')}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.activityCard,
              {
                flexDirection: rowDirection(isRTL),
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.cardBorder,
                opacity: pressed ? 0.8 : 1
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (latestUpdate?.route) {
                router.push(latestUpdate.route);
              }
            }}
          >
            <View style={[styles.activityIcon, { backgroundColor: (latestUpdate?.color || colors.pink) + '20' }]}>
              <MaterialCommunityIcons
                name={(latestUpdate?.icon || "alert-decagram-outline") as any}
                size={24}
                color={latestUpdate?.color || colors.pink}
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>
                {latestUpdate?.title || t('home.redesignTitle')}
              </Text>
              <Text style={[styles.activitySub, { color: colors.textSecondary }]}>
                {latestUpdate?.description || t('home.redesignDescription')}
              </Text>
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
  greetingName: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl, marginTop: -4 },
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
    ...Shadows.lg,
  },
  promoGradient: {
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoTextGroup: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  promoBadgeText: {
    fontFamily: Fonts.extraBold,
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  promoTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  promoSub: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    opacity: 0.8,
  },
  promoIconOuter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  promoIconInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  emergencyButton: {
    minHeight: 100,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  emergencyGlowOrb: {
    position: 'absolute',
    right: -25,
    top: -25,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  emergencyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emergencyTextGroup: { flex: 1 },
  emergencyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  emergencyLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C853',
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  emergencyLiveText: {
    color: 'rgba(255,255,255,0.95)',
    fontFamily: Fonts.extraBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.lg,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emergencySub: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  emergencyArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 999,
  },
  loadingGlass: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  loadingOverlayText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
});
