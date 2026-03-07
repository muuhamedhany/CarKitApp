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

type Order = {
  order_id: number;
  total_amount: string;
  status: string;
  order_date: string;
  items?: { order_item_id: number }[];
};

export default function MyOrdersScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'delivered'>('active');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setOrders(data.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchOrders();
  }, [token]);

  const filtered = orders.filter(o => {
    if (activeTab === 'delivered') return o.status === 'delivered' || o.status === 'completed';
    return o.status !== 'delivered' && o.status !== 'completed';
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return '#FF9800';
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      default: return Colors.pink;
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['active', 'delivered'] as const).map(tab => (
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
          <MaterialCommunityIcons name="package-variant" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No {activeTab} orders</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.order_id)}
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{1000 + item.order_id}</Text>
                  <Text style={styles.orderDate}>{formatDate(item.order_date)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              {item.items && (
                <Text style={styles.itemCount}>
                  {Array.isArray(item.items) ? item.items.length : 0} item{Array.isArray(item.items) && item.items.length !== 1 ? 's' : ''}
                </Text>
              )}
              <View style={styles.orderDivider} />
              <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalAmount}>{item.total_amount} EGP</Text>
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
  tab: {
    paddingVertical: 12, borderRadius: BorderRadius.xl, alignItems: 'center',
  },
  tabInactive: {
    backgroundColor: Colors.backgroundSecondary, borderWidth: 1, borderColor: Colors.border,
  },
  tabText: { color: Colors.white, fontSize: FontSizes.sm, fontFamily: Fonts.semiBold },
  tabTextInactive: { color: Colors.textSecondary },
  emptyText: { color: Colors.textMuted, fontSize: FontSizes.md, fontFamily: Fonts.medium, marginTop: Spacing.md },
  orderCard: {
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.cardBorder, padding: Spacing.md, marginBottom: Spacing.md,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderId: { color: Colors.white, fontSize: FontSizes.md, fontFamily: Fonts.bold },
  orderDate: { color: Colors.textMuted, fontSize: FontSizes.xs, fontFamily: Fonts.regular, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.sm },
  statusText: { fontSize: FontSizes.xs, fontFamily: Fonts.semiBold },
  itemCount: { color: Colors.textSecondary, fontSize: FontSizes.xs, fontFamily: Fonts.regular, marginTop: 4 },
  orderDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  totalLabel: { color: Colors.textMuted, fontSize: FontSizes.sm, fontFamily: Fonts.regular },
  totalAmount: { color: Colors.white, fontSize: FontSizes.xl, fontFamily: Fonts.extraBold },
  viewDetailsBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  viewDetailsGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: BorderRadius.xl },
  viewDetailsText: { color: Colors.white, fontSize: FontSizes.sm, fontFamily: Fonts.semiBold },
});
