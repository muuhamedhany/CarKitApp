import {
  CenteredHeader,
  GlassView } from '@/components';
import { SkeletonBone } from '@/components/common/SkeletonPlaceholder';
import { API_URL } from '@/constants/config';
import { BorderRadius,
  FontSizes,
  Fonts,
  Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition
} from 'react-native-reanimated';
import Text from '@/components/common/LocalizedText';
const TypedFlashList = FlashList as any;

type Order = {
  order_id: number;
  shipping_address_fk?: number | null;
  total_amount: string;
  status: string;
  order_date: string;
  delivery_type?: 'home_delivery' | 'workshop_fitting' | string;
  vendor_name?: string | null;
  items?: any[];
};

type TabType = 'active' | 'delivered' | 'workshop';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFB74D',
  confirmed: '#64B5F6',
  processing: '#818CF8',
  ready_for_pickup: '#F97316',
  in_transit: '#AB47BC',
  shipped: '#E91E8C',
  delivered: '#81C784',
  cancelled: '#EF5350',
  delivery: '#AB47BC',
};

export default function MyOrdersScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useTranslation();
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
      const query = new URLSearchParams({
        page: String(pageNum),
        pageSize: '10',
        delivery_type: tab === 'workshop' ? 'workshop_fitting' : 'home_delivery',
      });
      if (tab !== 'workshop') {
        query.append('status', tab === 'active' ? 'active' : 'delivered');
      }

      const res = await fetch(`${API_URL}/orders/my?${query.toString()}`, {
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
      return new Date(dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
    } catch { return dateStr; }
  };

  const renderOrder = ({ item, index }: { item: Order; index: number }) => {
    const rawStatus = String(item.status || '');
    const normalizedStatus = rawStatus.toLowerCase().replace(/-/g, '_');
    const statusColor = STATUS_COLORS[normalizedStatus] || colors.pink;
    const isWorkshopOrder = item.delivery_type === 'workshop_fitting' || item.shipping_address_fk === null;

    return (
      <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.cardContainer}
    >
      <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={[styles.orderId, { color: colors.textPrimary }]}>{t('orders.orderNumber', { id: item.order_id })}</Text>
            <Text style={[styles.orderDate, { color: colors.textMuted }]}>{formatDate(item.order_date)}</Text>
            {isWorkshopOrder ? (
              <View style={[styles.workshopBadge, { backgroundColor: '#10B98120', borderColor: '#10B98140' }]}>
                <MaterialCommunityIcons name="wrench-outline" size={12} color="#10B981" />
                <Text style={styles.workshopBadgeText}>
                  {t('orders.workshopBadge')}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {t(`status.${normalizedStatus}`, { defaultValue: rawStatus })}
            </Text>
          </View>
        </View>

        <View style={[styles.orderDivider, { backgroundColor: colors.border }]} />

        <View style={styles.orderFooter}>
          <View style={styles.totalBlock}>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>{t('cart.totalAmount')}</Text>
            <View style={styles.totalAmountRow}>
              <Text
                style={[styles.totalValue, { color: colors.textPrimary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.82}
              >
                {Number(item.total_amount || 0).toLocaleString('en-EG')}
              </Text>
              <Text style={[styles.currencyLabel, { color: colors.pink }]}> {t('common.currency.egp')}</Text>
            </View>
          </View>
          <Pressable
            style={styles.detailsPressable}
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
              <Text style={styles.viewDetailsText}>{t('common.details')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="white" />
            </LinearGradient>
          </Pressable>
        </View>
      </GlassView>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      {/* Static Header & Tabs - Always Visible */}
      <View style={styles.staticHeader}>
        <CenteredHeader title="orders.myOrders" titleColor={colors.textPrimary} />
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
              <Text style={[styles.tabText, { color: tab === 'active' ? 'white' : colors.textSecondary }]}>{t('filter.active')}</Text>
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
              <Text style={[styles.tabText, { color: tab === 'delivered' ? 'white' : colors.textSecondary }]}>{t('filter.delivered')}</Text>
            </Pressable>
            <Pressable
              style={styles.tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab('workshop');
              }}
            >
              {tab === 'workshop' && (
                <Animated.View layout={LinearTransition} style={[StyleSheet.absoluteFill, styles.tabHighlight, { backgroundColor: colors.pink }]} />
              )}
              <Text style={[styles.tabText, { color: tab === 'workshop' ? 'white' : colors.textSecondary }]}>{t('orders.workshop')}</Text>
            </Pressable>
          </GlassView>
        </View>
      </View>

      {/* Dynamic Content Area */}
      {loading && !refreshing ? (
        <ScrollView contentContainerStyle={styles.skeletonContainer} showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      ) : orders.length === 0 ? (
        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown} style={styles.emptyContent}>
            <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIconContainer, { borderColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialCommunityIcons name={tab === 'workshop' ? 'car-wrench' : 'package-variant'} size={48} color={colors.pink} />
            </GlassView>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {tab === 'workshop'
                ? t('orders.emptyWorkshopTitle')
                : t('orders.emptyTitle', { status: t(tab === 'active' ? 'orders.activeLower' : 'status.deliveredLower') })}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {tab === 'workshop'
                ? t('orders.emptyWorkshopSubtitle')
                : t('orders.emptySubtitle', { status: t(tab === 'active' ? 'orders.activeLower' : 'status.deliveredLower') })}
            </Text>
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
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.pink} style={{ marginVertical: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  staticHeader: { zIndex: 10 },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContent: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  tabContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
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
  workshopBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  workshopBadgeText: { color: '#10B981', fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  orderDivider: { height: 1, marginVertical: Spacing.lg, opacity: 0.1 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md },
  totalBlock: { flex: 1, minWidth: 0 },
  totalLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl, marginTop: 2 },
  totalAmountRow: { flexDirection: 'row', alignItems: 'baseline' },
  currencyLabel: { fontFamily: Fonts.bold, fontSize: 12, marginLeft: 2 },
  detailsPressable: { flexShrink: 0 },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: BorderRadius.full, gap: 6 },
  viewDetailsText: { color: 'white', fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  skeletonContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.md },
  skeletonCard: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: Spacing.md },
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  skeletonDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: Spacing.lg },
  skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, overflow: 'hidden', borderWidth: 1 },
  emptyTitle: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl, marginBottom: 8 },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, textAlign: 'center', opacity: 0.6, paddingHorizontal: Spacing.xl },
});
