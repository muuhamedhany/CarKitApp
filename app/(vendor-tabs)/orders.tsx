import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { vendorService } from '@/services/api/vendor.service';
import { VendorOrder } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type OrderFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

export default function VendorOrdersScreen() {
    const { colors } = useTheme();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();

    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
    const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            const res = await vendorService.getOrders(activeFilter);
            if (res.success && res.data) {
                setOrders(res.data);
            }
        } catch (error: any) {
            showToast('error', 'Error', error?.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
        }
    }, [activeFilter, showToast]);

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [loadOrders])
    );

    const formatDate = (value: string) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusPalette = (status: string) => {
        const normalized = (status || '').toLowerCase();
        if (normalized === 'delivered') return { bg: 'rgba(16,185,129,0.12)', fg: '#10B981' };
        if (normalized === 'shipped') return { bg: 'rgba(249,115,22,0.12)', fg: '#F97316' };
        if (normalized === 'processing') return { bg: 'rgba(99,102,241,0.12)', fg: '#6366F1' };
        if (normalized === 'pending') return { bg: 'rgba(205,66,168,0.12)', fg: colors.pink };
        return { bg: colors.pinkGlow, fg: colors.pink };
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Orders</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track current vendor order flow.</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                {(['all', 'pending', 'processing', 'shipped', 'delivered'] as OrderFilter[]).map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                        <Pressable
                            key={filter}
                            onPress={() => setActiveFilter(filter)}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: isActive ? colors.pink : colors.backgroundSecondary,
                                    borderColor: isActive ? colors.pink : colors.cardBorder,
                                },
                            ]}
                        >
                            <Text style={[styles.filterText, { color: isActive ? colors.white : colors.textPrimary }]}>
                                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {loading ? (
                <ActivityIndicator size="large" color={colors.pink} style={{ marginTop: 50 }} />
            ) : (
                <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
                    {orders.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders found for this filter.</Text>
                        </View>
                    ) : (
                        orders.map((order) => {
                            const isExpanded = expandedOrderId === order.order_id;
                            const palette = getStatusPalette(order.status);

                            return (
                                <Pressable
                                    key={order.order_id}
                                    onPress={() => setExpandedOrderId(isExpanded ? null : order.order_id)}
                                    style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                >
                                    <View style={styles.orderTopRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>Order #{order.order_id}</Text>
                                            <Text style={[styles.orderMeta, { color: colors.textMuted }]}>{order.customer_name} · {formatDate(order.order_date)}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                                            <Text style={[styles.statusBadgeText, { color: palette.fg }]}>{order.status}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.orderStatsRow}>
                                        <Text style={[styles.orderMeta, { color: colors.textMuted }]}>{order.item_count} items</Text>
                                        <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>{Number(order.total_amount).toLocaleString('en-EG')} EGP</Text>
                                    </View>

                                    {isExpanded && (
                                        <View style={[styles.expandedBox, { borderTopColor: colors.itemSeparator }]}>
                                            {order.items.map((item) => (
                                                <View key={item.order_item_id} style={styles.itemRow}>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.product_name}</Text>
                                                        <Text style={[styles.itemMeta, { color: colors.textMuted }]}>Qty {item.quantity} · {Number(item.price_each).toLocaleString('en-EG')} EGP</Text>
                                                    </View>
                                                    <Text style={[styles.itemTotal, { color: colors.pink }]}>{(Number(item.price_each) * item.quantity).toLocaleString('en-EG')} EGP</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </Pressable>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xxl,
    },
    subtitle: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    filterRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    filterText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    listContent: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: 160,
    },
    orderCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    orderTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    orderNumber: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    orderMeta: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    orderStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    orderTotal: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    statusBadge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
    },
    statusBadgeText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
        textTransform: 'capitalize',
    },
    expandedBox: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        gap: Spacing.md,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    itemName: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
        marginBottom: 2,
    },
    itemMeta: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
    },
    itemTotal: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
    emptyState: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.xxl,
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
});