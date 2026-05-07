import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { vendorService } from '@/services/api/vendor.service';
import { VendorDashboardResponse } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { DashboardSkeleton } from '@/components/common/SkeletonPlaceholder';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const [dashboard, setDashboard] = useState<VendorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vendorService.getDashboard();
      if (res.success && res.data) {
        setDashboard(res.data);
      }
    } catch (error: any) {
      showToast('error', 'Error', error?.message || 'Failed to load vendor dashboard.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const stats = dashboard
    ? [
      { label: 'Total Products', value: String(dashboard.stats.total_products), icon: 'package-variant', color: '#6366F1', subtitle: 'In catalogue' },
      { label: 'Total Orders', value: String(dashboard.stats.total_orders), icon: 'receipt-text', color: '#10B981', subtitle: `${dashboard.stats.active_orders} active` },
      { label: 'Revenue', value: `${Number(dashboard.stats.revenue).toLocaleString('en-EG')}`, icon: 'cash-multiple', color: colors.pink, subtitle: 'All time' },
      { label: 'Low Stock', value: String(dashboard.stats.low_stock_count), icon: 'alert-circle-outline', color: '#F97316', subtitle: `${dashboard.stats.out_of_stock_count} out of stock` },
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
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello, {user?.name}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Dashboard</Text>
        </Animated.View>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <View style={styles.statsContainer}>
              {stats.map((stat, index) => (
                <Animated.View 
                  key={stat.label} 
                  entering={FadeInUp.delay(200 + index * 100).duration(800)}
                  style={styles.statCardWrapper}
                >
                  <BlurView 
                    intensity={isDark ? 20 : 40} 
                    tint={isDark ? 'dark' : 'light'} 
                    style={[styles.statCard, { borderColor: colors.cardBorder }]}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: `${stat.color}18` }]}>
                      <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                    </View>
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                    <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{stat.subtitle}</Text>
                  </BlurView>
                </Animated.View>
              ))}
            </View>

            <Animated.View entering={FadeInUp.delay(600).duration(800)} style={styles.quickActions}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/promote' as any); }}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={[colors.pink, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.quickAction]}
                >
                  <MaterialCommunityIcons name="bullhorn-outline" size={20} color={colors.white} />
                  <Text style={[styles.quickActionText, { color: colors.white }]}>Promote Your Products</Text>
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(700).duration(800)}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/vendor-analytics'); }}
                style={({ pressed }) => [
                  styles.analyticsCard, 
                  { 
                    borderColor: colors.pink,
                    backgroundColor: colors.pink + '05',
                    opacity: pressed ? 0.8 : 1
                  }
                ]}
              >
                <View style={[styles.analyticsIcon, { backgroundColor: colors.pink + '15' }]}>
                  <MaterialCommunityIcons name="chart-line" size={22} color={colors.pink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.analyticsTitle, { color: colors.textPrimary }]}>Analytics</Text>
                  <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>Track product performance</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.pink} />
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(800).duration(800)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Orders</Text>
                <Pressable onPress={() => router.push('/(vendor-tabs)/orders')}>
                  <Text style={[styles.sectionLink, { color: colors.pink }]}>See All</Text>
                </Pressable>
              </View>

              {dashboard?.recent_orders.length ? (
                dashboard.recent_orders.map((order, idx) => (
                  <BlurView 
                    key={order.order_id} 
                    intensity={isDark ? 20 : 40} 
                    tint={isDark ? 'dark' : 'light'} 
                    style={[styles.orderCard, { borderColor: colors.cardBorder }]}
                  >
                    <View style={styles.orderTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.orderCustomer, { color: colors.textPrimary }]}>{order.customer_name}</Text>
                        <Text style={[styles.orderMeta, { color: colors.textSecondary }]}>Order #{order.order_id} · {formatDate(order.order_date)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusTint(order.status, colors).bg }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusTint(order.status, colors).fg }]}>{order.status}</Text>
                      </View>
                    </View>
                    <View style={styles.orderBottomRow}>
                      <Text style={[styles.orderMeta, { color: colors.textSecondary }]}>{order.item_count} items</Text>
                      <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>{Number(order.total_amount).toLocaleString('en-EG')} EGP</Text>
                    </View>
                  </BlurView>
                ))
              ) : (
                <BlurView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.emptyState, { borderColor: colors.cardBorder }]}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders yet.</Text>
                </BlurView>
              )}
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(900).duration(800)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Products</Text>
                <Pressable onPress={() => router.push('/(vendor-tabs)/products')}>
                  <Text style={[styles.sectionLink, { color: colors.pink }]}>Manage</Text>
                </Pressable>
              </View>

              {dashboard?.top_products.length ? (
                dashboard.top_products.map((product) => (
                  <BlurView 
                    key={product.product_id} 
                    intensity={isDark ? 20 : 40} 
                    tint={isDark ? 'dark' : 'light'} 
                    style={[styles.productRow, { borderColor: colors.cardBorder }]}
                  >
                    <Image
                      source={{ uri: product.image_url || 'https://via.placeholder.com/40' }}
                      style={styles.productThumb}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
                      <Text style={[styles.productMeta, { color: colors.textSecondary }]}>{product.sold_units} sold · {product.stock} left</Text>
                    </View>
                    <Text style={[styles.productRevenue, { color: colors.pink }]}>{Number(product.price).toLocaleString('en-EG')} EGP</Text>
                  </BlurView>
                ))
              ) : (
                <BlurView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.emptyState, { borderColor: colors.cardBorder }]}>
                  <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products yet.</Text>
                </BlurView>
              )}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function getStatusTint(status: string, colors: any) {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'delivered') return { bg: 'rgba(16,185,129,0.12)', fg: '#10B981' };
  if (normalized === 'shipped') return { bg: 'rgba(249,115,22,0.12)', fg: '#F97316' };
  if (normalized === 'processing') return { bg: 'rgba(99,102,241,0.12)', fg: '#6366F1' };
  return { bg: colors.pinkGlow, fg: colors.pink };
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
    marginBottom: Spacing.md,
  },
  greeting: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginBottom: 4,
    opacity: 0.8,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
    letterSpacing: -1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quickAction: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
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
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    marginBottom: Spacing.lg,
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCardWrapper: {
    width: '48.5%',
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  statSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    marginTop: 2,
    opacity: 0.7,
  },
  section: {
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  sectionLink: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  orderCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  orderTopRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderCustomer: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  orderMeta: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },
  orderTotal: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    textTransform: 'capitalize',
  },
  productRow: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  productThumb: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f0f0f0',
  },
  productName: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  productMeta: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },
  productRevenue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  emptyState: {
    marginTop: Spacing.md,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
  },
});
