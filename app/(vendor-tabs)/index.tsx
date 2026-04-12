import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { vendorService } from '@/services/api/vendor.service';
import { VendorDashboardResponse } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const [dashboard, setDashboard] = useState<VendorDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

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

  const stats = dashboard
    ? [
      { label: 'Total Products', value: String(dashboard.stats.total_products), icon: 'package-variant', color: '#6366F1' },
      { label: 'Orders', value: String(dashboard.stats.total_orders), icon: 'receipt-text', color: '#10B981' },
      { label: 'Revenue', value: `${Number(dashboard.stats.revenue).toLocaleString('en-EG')} EGP`, icon: 'currency-usd', color: '#EC4899' },
      { label: 'Low Stock', value: String(dashboard.stats.low_stock_count), icon: 'alert-circle-outline', color: '#F97316' },
    ]
    : [];

  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : date.toLocaleDateString('en-EG', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Hello, {user?.name}</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Dashboard</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.pink} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsContainer}>
              {stats.map((stat) => (
                <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.iconContainer, { backgroundColor: `${stat.color}18` }]}>
                    <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                  </View>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.quickActions}>
              <Pressable
                onPress={() => router.push('/(vendor-tabs)/products')}
                style={[styles.quickAction, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
              >
                <MaterialCommunityIcons name="package-variant" size={20} color={colors.pink} />
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Inventory</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(vendor-tabs)/orders')}
                style={[styles.quickAction, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
              >
                <MaterialCommunityIcons name="receipt-text" size={20} color={colors.pink} />
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>Orders</Text>
              </Pressable>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Orders</Text>
                <Pressable onPress={() => router.push('/(vendor-tabs)/orders')}>
                  <Text style={[styles.sectionLink, { color: colors.pink }]}>See All</Text>
                </Pressable>
              </View>

              {dashboard?.recent_orders.length ? (
                dashboard.recent_orders.map((order) => (
                  <View key={order.order_id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.orderTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.orderCustomer, { color: colors.textPrimary }]}>{order.customer_name}</Text>
                        <Text style={[styles.orderMeta, { color: colors.textMuted }]}>Order #{order.order_id} · {formatDate(order.order_date)}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusTint(order.status, colors).bg }]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusTint(order.status, colors).fg }]}>{order.status}</Text>
                      </View>
                    </View>
                    <View style={styles.orderBottomRow}>
                      <Text style={[styles.orderMeta, { color: colors.textMuted }]}>{order.item_count} items</Text>
                      <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>{Number(order.total_amount).toLocaleString('en-EG')} EGP</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders yet.</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Top Products</Text>
                <Pressable onPress={() => router.push('/(vendor-tabs)/products')}>
                  <Text style={[styles.sectionLink, { color: colors.pink }]}>Manage</Text>
                </Pressable>
              </View>

              {dashboard?.top_products.length ? (
                dashboard.top_products.map((product) => (
                  <View key={product.product_id} style={[styles.productRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
                      <Text style={[styles.productMeta, { color: colors.textMuted }]}>{product.sold_units} sold · {product.stock} left</Text>
                    </View>
                    <Text style={[styles.productRevenue, { color: colors.pink }]}>{Number(product.price).toLocaleString('en-EG')} EGP</Text>
                  </View>
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products yet.</Text>
                </View>
              )}
            </View>
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickAction: {
    flex: 1,
    borderRadius: BorderRadius.lg,
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
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
  section: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    padding: Spacing.xxl,
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
