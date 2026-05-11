import { CenteredHeader, GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { bookingService } from '@/services/api/booking.service';
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
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition
} from 'react-native-reanimated';
const TypedFlashList = FlashList as any;

const { width, height } = Dimensions.get('window');

type Booking = {
  booking_id: number;
  service_name: string;
  provider_name?: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  booking_price: string | number;
  location?: string;
  status: string;
};

type TabType = 'upcoming' | 'completed';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFB74D',
  confirmed: '#64B5F6',
  completed: '#81C784',
  cancelled: '#EF5350',
  'in-progress': '#AB47BC',
};

export default function MyBookingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { token } = useAuth();
  const [tab, setTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!token) return;

    if (pageNum === 1 && !isRefresh) setLoading(true);
    if (pageNum > 1) setLoadingMore(true);

    try {
      const statusParam = tab === 'upcoming' ? 'upcoming' : 'completed_all';
      const response = await bookingService.getMyBookings(statusParam, pageNum, 10);
      if (response.success) {
        const newBookings = response.data || [];
        setBookings(prev => pageNum === 1 ? newBookings : [...prev, ...newBookings]);

        if (response.pagination) {
          setHasMore(pageNum < response.pagination.totalPages);
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
    fetchBookings(1);
  }, [tab, fetchBookings]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBookings(nextPage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBookings(1, true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatMoney = (value: string | number) => `${Number(value || 0).toLocaleString('en-EG')} EGP`;

  const formatTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      const [hours, minutes] = value.split(':').map((part) => Number(part));
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return value;
    }
  };

  const renderBooking = ({ item, index }: { item: Booking; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.cardContainer}
    >
      <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingLeft}>
            <Text style={[styles.bookingName, { color: colors.textPrimary }]} numberOfLines={1}>{item.service_name}</Text>
            {item.provider_name && (
              <Text style={[styles.providerName, { color: colors.pink }]}>{item.provider_name}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || colors.pink) + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || colors.pink }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location || 'No location selected'}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDate(item.booking_date)}</Text>
          </View>
          {item.start_time && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatTime(item.start_time)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.footer}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{formatMoney(item.booking_price)}</Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/booking/[id]' as any, params: { id: String(item.booking_id) } });
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

      <CenteredHeader title="My Bookings" titleColor={colors.textPrimary} />

      <View style={styles.tabContainer}>
        <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.tabRow, { borderColor: 'rgba(255,255,255,0.1)' }]}>
          <Pressable
            style={[styles.tab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTab('upcoming');
            }}
          >
            {tab === 'upcoming' && (
              <Animated.View layout={LinearTransition} style={[StyleSheet.absoluteFill, styles.tabHighlight, { backgroundColor: colors.pink }]} />
            )}
            <Text style={[styles.tabText, { color: tab === 'upcoming' ? 'white' : colors.textSecondary }]}>Upcoming</Text>
          </Pressable>
          <Pressable
            style={[styles.tab]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTab('completed');
            }}
          >
            {tab === 'completed' && (
              <Animated.View layout={LinearTransition} style={[StyleSheet.absoluteFill, styles.tabHighlight, { backgroundColor: colors.pink }]} />
            )}
            <Text style={[styles.tabText, { color: tab === 'completed' ? 'white' : colors.textSecondary }]}>Completed</Text>
          </Pressable>
        </GlassView>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : bookings.length === 0 ? (
        <Animated.View entering={FadeInDown} style={styles.center}>
          <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIconContainer, { borderColor: 'rgba(255,255,255,0.1)' }]}>
            <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.pink} />
          </GlassView>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No {tab} bookings</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Your {tab} service bookings will appear here.</Text>
        </Animated.View>
      ) : (
        <TypedFlashList
          data={bookings}
          keyExtractor={(item: any) => item.booking_id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          estimatedItemSize={200}
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
  bookingCard: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.xl,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  bookingLeft: { flex: 1, marginRight: Spacing.sm },
  bookingName: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, letterSpacing: 0.3 },
  providerName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.8 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, opacity: 0.6 },
  divider: { height: 1, marginVertical: Spacing.lg, opacity: 0.1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl, marginTop: 2 },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: BorderRadius.full, gap: 6 },
  viewDetailsText: { color: 'white', fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, overflow: 'hidden', borderWidth: 1 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginBottom: 8 },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, textAlign: 'center', opacity: 0.6, paddingHorizontal: Spacing.xl },
});
