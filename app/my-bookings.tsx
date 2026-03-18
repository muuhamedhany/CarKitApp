import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants/config';
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type Booking = {
  booking_id: number;
  service_name: string;
  provider_name?: string;
  booking_date: string;
  booking_time?: string;
  total_amount: string;
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
  const router = useRouter();
  const { token } = useAuth();
  const [tab, setTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBookings(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const filteredBookings = bookings.filter((b) => {
    if (tab === 'completed') return b.status === 'completed' || b.status === 'cancelled';
    return b.status !== 'completed' && b.status !== 'cancelled';
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
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
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || Colors.pink) + '30' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || Colors.pink }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar" size={14} color={Colors.textMuted} />
          <Text style={styles.metaText}>{formatDate(item.booking_date)}</Text>
        </View>
        {item.booking_time && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.metaText}>{item.booking_time}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{item.total_amount} EGP</Text>
      </View>

      <Pressable style={styles.viewDetailsBtn}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
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
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={styles.backBtn} />
      </View>

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

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No {tab} bookings</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.booking_id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingBottom: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  backBtn: { width: 32 },
  headerTitle: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.xl },

  tabRow: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md, gap: Spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: BorderRadius.lg,
    alignItems: 'center', backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  tabActive: {
    backgroundColor: Colors.gradientStart,
    borderColor: Colors.gradientStart,
  },
  tabText: { color: Colors.textSecondary, fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
  tabTextActive: { color: Colors.white },

  bookingCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  bookingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 6,
  },
  bookingLeft: { flex: 1, marginRight: Spacing.sm },
  bookingName: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.md },
  providerName: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.textSecondary, fontFamily: Fonts.regular, fontSize: FontSizes.xs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  totalLabel: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  totalValue: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.xl },
  viewDetailsBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.lg },
  viewDetailsText: { color: Colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },

  emptyTitle: { color: Colors.textMuted, fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginTop: Spacing.md },
});
