import {
  GlassView
} from '@/components';
import { DashboardSkeleton } from '@/components/common/SkeletonPlaceholder';
import {
  BorderRadius,
  FontSizes,
  Fonts,
  Shadows,
  Spacing
} from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTabReload } from '@/hooks/useTabReload';
import { useTheme } from '@/hooks/useTheme';
import { vendorService } from '@/services/api/vendor.service';
import { notificationService } from '@/services/api/notification.service';
import { VendorDashboardResponse } from '@/types/api.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '@/components/common/LocalizedText';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const [dashboard, setDashboard] = useState<VendorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const hasLoaded = useRef(false);

  useTabReload('index', () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    onRefresh();
  });

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    try {
      if (!hasLoaded.current) setLoading(true);
      const res = await vendorService.getDashboard();
      if (res.success && res.data) {
        setDashboard(res.data);
        hasLoaded.current = true;
      }
      try {
        const unreadRes = await notificationService.getUnreadCount();
        if (unreadRes.success && unreadRes.data) {
          setUnreadCount(unreadRes.data.count);
        }
      } catch { /* non-blocking */ }
    } catch (error: any) {
      showToast('error', 'Error', error?.message || 'Failed to load vendor dashboard.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const stats = dashboard
    ? [
      {
        label: 'Total Products',
        value: String(dashboard.stats.total_products),
        icon: 'package-variant',
        color: '#6366F1',
        subtitle: 'In catalogue',
        onPress: () => router.push('/(vendor-tabs)/products')
      },
      {
        label: 'Total Orders',
        value: String(dashboard.stats.total_orders),
        icon: 'receipt-text',
        color: '#10B981',
        subtitle: `${dashboard.stats.active_orders} active`,
        onPress: () => router.push('/(vendor-tabs)/orders')
      },
      {
        label: 'Revenue',
        value: `${Number(dashboard.stats.revenue).toLocaleString('en-EG')}`,
        icon: 'cash-multiple',
        color: colors.pink,
        subtitle: 'All time',
        onPress: () => router.push('/vendor-analytics')
      },
      {
        label: 'Low Stock',
        value: String(dashboard.stats.low_stock_count),
        icon: 'alert-circle-outline',
        color: '#F97316',
        subtitle: `${dashboard.stats.out_of_stock_count} out of stock`,
        onPress: () => router.push({ pathname: '/(vendor-tabs)/products', params: { filter: 'low-stock' } })
      },
    ]
    : [];

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || 'Vendor'}</Text>
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

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <Animated.View
                  key={stat.label}
                  entering={FadeInUp.delay(index * 100).duration(600)}
                  style={styles.statWrapper}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      stat.onPress();
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
                  >
                    <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statCard, { borderColor: colors.cardBorder }]}>
                      <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
                        <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                      </View>
                      <View style={styles.statInfo}>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                        <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{stat.subtitle}</Text>
                      </View>
                    </GlassView>
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.quickActions}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/promote' as any);
                }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={[colors.pink, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.quickAction, { borderColor: 'transparent' }]}
                >
                  <MaterialCommunityIcons name="bullhorn-outline" size={20} color={colors.white} />
                  <Text style={[styles.quickActionText, { color: colors.white }]}>Promote Your Products</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(500).duration(800)}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/vendor-analytics');
                }}
                style={({ pressed }) => [
                  styles.analyticsCard,
                  { borderColor: colors.pink, transform: [{ scale: pressed ? 0.98 : 1 }] }
                ]}
              >
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                <View style={[styles.analyticsIcon, { backgroundColor: colors.purpleGlow }]}>
                  <MaterialCommunityIcons name="chart-line" size={22} color={colors.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.analyticsTitle, { color: colors.textPrimary }]}>Detailed Analytics</Text>
                  <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>Track your sales performance</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.pink} />
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(600).duration(800)}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Orders</Text>
              {dashboard?.recent_orders && dashboard.recent_orders.length > 0 ? (
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.recentOrdersCard, { borderColor: colors.cardBorder }]}>
                  {dashboard.recent_orders.map((order, index) => (
                    <Pressable
                      key={order.order_id}
                      style={({ pressed }) => [
                        styles.orderItem,
                        {
                          borderBottomWidth: index === dashboard.recent_orders.length - 1 ? 0 : 1,
                          borderBottomColor: colors.cardBorder,
                          backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent'
                        }
                      ]}
                      onPress={() => router.push(`/order/${order.order_id}?role=vendor`)}
                    >
                      <View style={styles.orderMain}>
                        <Text style={[styles.orderId, { color: colors.textPrimary }]}>Order #{order.order_id}</Text>
                        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(order.order_date)}</Text>
                      </View>
                      <View style={styles.orderRight}>
                        <Text style={[styles.orderAmount, { color: colors.pink }]}>{Number(order.total_amount).toLocaleString('en-EG')} EGP</Text>
                        <View style={[styles.statusBadge, { backgroundColor: order.status === 'pending' ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)' }]}>
                          <Text style={[styles.statusText, { color: order.status === 'pending' ? '#F97316' : '#10B981' }]}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </GlassView>
              ) : (
                <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={styles.emptyState}>
                  <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent orders</Text>
                </GlassView>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerLeft: { flex: 1 },
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
  greeting: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
    letterSpacing: -1,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statWrapper: {
    width: '48%',
  },
  statCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.md,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statInfo: {
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  statLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  statSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 10,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quickAction: {
    flex: 1,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  quickActionText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  analyticsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.md,
  },
  analyticsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyticsTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  analyticsSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
  },
  recentOrdersCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.md,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  orderMain: {
    gap: 4,
  },
  orderId: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  orderDate: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  orderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  orderAmount: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: Fonts.semiBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
  },
});
