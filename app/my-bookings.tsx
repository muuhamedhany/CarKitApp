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
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/api/booking.service';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

import { CenteredHeader } from '@/components';

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
  const { colors } = useTheme();
  const styles = createStyles(colors);
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

  const renderBooking = ({ item }: { item: Booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingLeft}>
          <Text style={styles.bookingName} numberOfLines={1}>{item.service_name}</Text>
          {item.provider_name && (
            <Text style={styles.providerName}>{item.provider_name}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || colors.pink) + '30' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || colors.pink }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={[styles.serviceText, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.provider_name ? `Provider: ${item.provider_name}` : 'Provider details unavailable'}
      </Text>
      <Text style={[styles.serviceText, { color: colors.textSecondary }]} numberOfLines={1}>
        {item.location || 'No location selected'}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar" size={14} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatDate(item.booking_date)}</Text>
        </View>
        {item.start_time && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
            <Text style={styles.metaText}>{formatTime(item.start_time)}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatMoney(item.booking_price)}</Text>
      </View>

      <Pressable
        style={styles.viewDetailsBtn}
        onPress={() => router.push({ pathname: '/booking/[id]' as any, params: { id: String(item.booking_id) } })}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.viewDetailsGradient}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <CenteredHeader title="My Bookings" titleColor={colors.textPrimary} />

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === 'upcoming' && styles.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && styles.tabTextActive]}>Upcoming</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'completed' && styles.tabActive]}
          onPress={() => setTab('completed')}
        >
          <Text style={[styles.tabText, tab === 'completed' && styles.tabTextActive]}>Completed</Text>
        </Pressable>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No {tab} bookings</Text>
        </View>
      ) : (
        <FlashList
          data={bookings}
          keyExtractor={(item) => item.booking_id.toString()}
          renderItem={renderBooking}
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

  bookingCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 6,
  },
  bookingLeft: { flex: 1, marginRight: Spacing.sm },
  bookingName: { color: colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.md },
  providerName: { color: colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
  serviceText: { color: colors.textSecondary, fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: colors.textSecondary, fontFamily: Fonts.regular, fontSize: FontSizes.xs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  totalLabel: { color: colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  totalValue: { color: colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.xl },
  viewDetailsBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.lg },
  viewDetailsText: { color: colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },

  emptyTitle: { color: colors.textMuted, fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginTop: Spacing.md },
});
