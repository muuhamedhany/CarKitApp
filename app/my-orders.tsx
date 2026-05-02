import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonBone } from '@/components/common/SkeletonPlaceholder';
const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

import { CenteredHeader } from '@/components';

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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

  const renderOrder = ({ item }: { item: Order }) => (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.order_id}</Text>
            <Text style={styles.orderDate}>{formatDate(item.order_date)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || colors.pink) + '30' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || colors.pink }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDivider} />

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{item.total_amount} EGP</Text>
        </View>

        <AnimatedDetailsBtn item={item} styles={styles} colors={colors} router={router} />
      </View>
    );

  const AnimatedDetailsBtn = ({ item, styles, colors, router }: any) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
      <AnimatedPressableComponent
        style={[styles.viewDetailsBtn, animatedStyle]}
        onPressIn={() => scale.value = withSpring(0.95, { damping: 15, stiffness: 300 })}
        onPressOut={() => scale.value = withSpring(1, { damping: 15, stiffness: 300 })}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({ pathname: '/order/[id]', params: { id: String(item.order_id), role: 'customer' } });
        }}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewDetailsGradient}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </LinearGradient>
      </AnimatedPressableComponent>
    );
  };

  return (
    <View style={styles.container}>
      <CenteredHeader title="My Orders" titleColor={colors.textPrimary} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab('active');
          }}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'delivered' && styles.tabActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setTab('delivered');
          }}
        >
          <Text style={[styles.tabText, tab === 'delivered' && styles.tabTextActive]}>Delivered</Text>
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View style={{ paddingHorizontal: Spacing.lg, gap: Spacing.md, marginTop: Spacing.md }}>
          {[1,2,3].map(i => (
            <View key={i} style={{ backgroundColor: colors.backgroundSecondary, borderRadius: 16, padding: Spacing.md, borderWidth: 1, borderColor: colors.cardBorder }}>
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                 <View>
                   <SkeletonBone width={100} height={18} />
                   <SkeletonBone width={80} height={14} style={{ marginTop: 6 }} />
                 </View>
                 <SkeletonBone width={70} height={26} borderRadius={13} />
               </View>
               <SkeletonBone width="100%" height={1} style={{ marginBottom: Spacing.md }} />
               <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                 <SkeletonBone width={40} height={14} />
                 <SkeletonBone width={80} height={18} />
               </View>
               <SkeletonBone width="100%" height={44} borderRadius={12} />
            </View>
          ))}
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No {tab} orders</Text>
        </View>
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(item) => item.order_id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.pink} style={{ marginVertical: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 40 },

  tabRow: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md, gap: Spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg,
    alignItems: 'center', backgroundColor: colors.backgroundSecondary,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  tabActive: {
    backgroundColor: colors.gradientStart,
    borderColor: colors.gradientStart,
  },
  tabText: { color: colors.textSecondary, fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  tabTextActive: { color: colors.white },

  orderCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderId: { color: colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.md },
  orderDate: { color: colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },
  orderDivider: { height: 1, backgroundColor: colors.border, marginVertical: Spacing.sm },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  totalLabel: { color: colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  totalValue: { color: colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.xl },
  viewDetailsBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.lg },
  viewDetailsText: { color: colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },

  emptyTitle: { color: colors.textMuted, fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginTop: Spacing.md },
});
