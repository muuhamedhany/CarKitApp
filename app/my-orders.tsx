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

import BackButton from '@/components/BackButton';

type Order = {
  order_id: number;
  total_amount: string;
  status: string;
  created_at: string;
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
  const router = useRouter();
  const { token } = useAuth();
  const [tab, setTab] = useState<TabType>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filteredOrders = orders.filter((o) => {
    if (tab === 'delivered') return o.status === 'delivered';
    return o.status !== 'delivered';
  });

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
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || Colors.pink) + '30' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || Colors.pink }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.orderFooter}>
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
        <View style={styles.backBtn}>
          <BackButton noSpacer />
        </View>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
        >
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'delivered' && styles.tabActive]}
          onPress={() => setTab('delivered')}
        >
          <Text style={[styles.tabText, tab === 'delivered' && styles.tabTextActive]}>Delivered</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.pink} />
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="package-variant" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No {tab} orders</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.order_id.toString()}
          renderItem={renderOrder}
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

  orderCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  orderId: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.md },
  orderDate: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },
  orderDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  totalLabel: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  totalValue: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.xl },
  viewDetailsBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.lg },
  viewDetailsText: { color: Colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },

  emptyTitle: { color: Colors.textMuted, fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginTop: Spacing.md },
});
