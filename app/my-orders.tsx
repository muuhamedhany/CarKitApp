import { CenteredHeader, GlassView } from '@/components';
import { SkeletonBone } from '@/components/common/SkeletonPlaceholder';
import { API_URL } from '@/constants/config';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition
} from 'react-native-reanimated';
const TypedFlashList = FlashList as any;

const { width, height } = Dimensions.get('window');

type Order = {
  order_id: number;
  total_amount: string;
  status: string;
  order_date: string;
  items?: any[];
};

type TabType = 'active' | 'delivered';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFB74D',
  confirmed: '#64B5F6',
  shipped: '#E91E8C',
  delivered: '#81C784',
  cancelled: '#EF5350',
  delivery: '#AB47BC',
};

export default function MyOrdersScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const [tab, setTab] = useState<TabType>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!token) return;

    if (pageNum === 1 && !isRefresh) setLoading(true);
    if (pageNum > 1) setLoadingMore(true);

    try {
      const statusParam = tab === 'active' ? 'active' : 'delivered';
      const res = await fetch(`${API_URL}/orders/my?status=${statusParam}&page=${pageNum}&pageSize=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const newOrders = data.data || [];
        setOrders(prev => pageNum === 1 ? newOrders : [...prev, ...newOrders]);

        if (data.pagination) {
          setHasMore(pageNum < data.pagination.totalPages);
        } else {
          setHasMore(false);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [token, tab]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchOrders(1);
  }, [tab, fetchOrders]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchOrders(1, true);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.cardContainer}
    >
      <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={[styles.orderId, { color: colors.textPrimary }]}>Order #{item.order_id}</Text>
            <Text style={[styles.orderDate, { color: colors.textMuted }]}>{formatDate(item.order_date)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || colors.pink) + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || colors.pink }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={[styles.orderDivider, { backgroundColor: colors.border }]} />

        <View style={styles.orderFooter}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total amount</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{item.total_amount} EGP</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/order/[id]', params: { id: String(item.order_id), role: 'customer' } } as any);
            }}
          >
            <LinearGradient
              colors={[colors.pink, colors.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.viewDetailsBtn}
            >
              <Text style={styles.viewDetailsText}>Details</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="white" />
            </LinearGradient>
          </Pressable>
        </View>
      </GlassView>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <View style={styles.tabContainer}>
        <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.tabRow, { borderColor: 'rgba(255,255,255,0.1)' }]}>
          <Pressable
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTab('active');
            }}
          >
            {tab === 'active' && (
              <Animated.View layout={LinearTransition} style={[StyleSheet.absoluteFill, styles.tabHighlight, { backgroundColor: colors.pink }]} />
            )}
            <Text style={[styles.tabText, { color: tab === 'active' ? 'white' : colors.textSecondary }]}>Active</Text>
          </Pressable>
          <Pressable
            style={styles.tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTab('delivered');
            }}
          >
            {tab === 'delivered' && (
              <Animated.View layout={LinearTransition} style={[StyleSheet.absoluteFill, styles.tabHighlight, { backgroundColor: colors.pink }]} />
            )}
            <Text style={[styles.tabText, { color: tab === 'delivered' ? 'white' : colors.textSecondary }]}>Delivered</Text>
          </Pressable>
        </GlassView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map(i => (
            <GlassView key={i} intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <View>
                  <SkeletonBone width={100} height={18} />
                  <SkeletonBone width={80} height={14} style={{ marginTop: 6 }} />
                </View>
                <SkeletonBone width={70} height={26} borderRadius={13} />
              </View>
              <View style={styles.skeletonDivider} />
              <View style={styles.skeletonFooter}>
                <View>
                  <SkeletonBone width={40} height={10} />
                  <SkeletonBone width={80} height={18} style={{ marginTop: 4 }} />
                </View>
                <SkeletonBone width={80} height={36} borderRadius={18} />
              </View>
            </GlassView>
          ))}
        </View>
      ) : orders.length === 0 ? (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <CenteredHeader title="My Orders" titleColor={colors.textPrimary} />
          <Animated.View entering={FadeInDown} style={styles.center}>
            <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIconContainer, { borderColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialCommunityIcons name="package-variant" size={48} color={colors.pink} />
            </GlassView>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No {tab} orders</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Your {tab} product orders will appear here.</Text>
          </Animated.View>
        </ScrollView>
      ) : (
        <TypedFlashList
          data={orders}
          keyExtractor={(item: any) => item.order_id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          estimatedItemSize={180}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListHeaderComponent={<CenteredHeader title="My Orders" titleColor={colors.textPrimary} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.pink} style={{ marginVertical: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 40, paddingTop: Spacing.sm },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  tabContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  tabRow: { flexDirection: 'row', borderRadius: BorderRadius.full, padding: 4, overflow: 'hidden', borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full },
  tabHighlight: { borderRadius: BorderRadius.full },
  tabText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, zIndex: 1 },

  cardContainer: { marginBottom: Spacing.md },
  orderCard: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.xl,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, letterSpacing: 0.3 },
  orderDate: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2, opacity: 0.6 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  orderDivider: { height: 1, marginVertical: Spacing.lg, opacity: 0.1 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl, marginTop: 2 },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: BorderRadius.full, gap: 6 },
  viewDetailsText: { color: 'white', fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  skeletonContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.md },
  skeletonCard: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  skeletonDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: Spacing.lg },
  skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, overflow: 'hidden', borderWidth: 1 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginBottom: 8 },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, textAlign: 'center', opacity: 0.6, paddingHorizontal: Spacing.xl },
});
