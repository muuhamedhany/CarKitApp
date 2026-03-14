import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants/config';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type Booking = {
  booking_id: number;
  booking_date: string;
  start_time?: string;
  status: string;
  booking_price?: string;
  service_name: string;
  provider_name?: string;
};

export default function MyBookingsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`${API_URL}/bookings/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setBookings(data.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchBookings();
  }, [token]);

  const filtered = bookings.filter(b => {
    if (activeTab === 'completed') return b.status === 'completed' || b.status === 'cancelled';
    return b.status !== 'completed' && b.status !== 'cancelled';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'completed': return '#2196F3';
      case 'cancelled': return '#F44336';
      default: return '#FF9800';
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (t?: string) => {
    if (!t) return '';
    return t.slice(0, 5);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['upcoming', 'completed'] as const).map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1 }}>
            <LinearGradient
              colors={activeTab === tab
                ? [Colors.gradientStart, Colors.gradientEnd]
                : ['transparent', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.tab, activeTab !== tab && styles.tabInactive]}
            >
              <Text style={[styles.tabText, activeTab !== tab && styles.tabTextInactive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </LinearGradient>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No {activeTab} bookings</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.booking_id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View>
                  <Text style={styles.serviceName}>{item.service_name}</Text>
                  {item.provider_name && (
                    <Text style={styles.providerName}>{item.provider_name}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="calendar" size={14} color={Colors.textMuted} />
                  <Text style={styles.metaText}>{formatDate(item.booking_date)}</Text>
                </View>
                {item.start_time && (
                  <View style={styles.metaItem}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{formatTime(item.start_time)}</Text>
                  </View>
                )}
              </View>

              <View style={styles.bookingDivider} />

              <View style={styles.bookingFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>
                  {item.booking_price || '—'} EGP
                </Text>
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
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 56 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: Colors.white, fontSize: FontSizes.lg, fontFamily: Fonts.bold },
  tabRow: {
    flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, gap: 8,
  },
  tab: { paddingVertical: 12, borderRadius: BorderRadius.xl, alignItems: 'center' },
  tabInactive: {
    backgroundColor: Colors.backgroundSecondary, borderWidth: 1, borderColor: Colors.border,
  },
  tabText: { color: Colors.white, fontSize: FontSizes.sm, fontFamily: Fonts.semiBold },
  tabTextInactive: { color: Colors.textSecondary },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, fontFamily: Fonts.medium, marginTop: Spacing.md },
  bookingCard: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md, marginBottom: Spacing.md,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceName: { color: Colors.white, fontSize: FontSizes.md, fontFamily: Fonts.bold },
  providerName: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontFamily: Fonts.regular, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSizes.xs, fontFamily: Fonts.semiBold },
  metaRow: { flexDirection: 'row', marginTop: Spacing.sm, gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: Colors.textMuted, fontSize: FontSizes.xs, fontFamily: Fonts.regular, marginLeft: 4 },
  bookingDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  totalLabel: { color: Colors.textMuted, fontSize: FontSizes.sm, fontFamily: Fonts.regular },
  totalAmount: { color: Colors.white, fontSize: FontSizes.xl, fontFamily: Fonts.extraBold },
  viewDetailsBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.xl },
  viewDetailsText: { color: Colors.white, fontSize: FontSizes.sm, fontFamily: Fonts.semiBold },
});
