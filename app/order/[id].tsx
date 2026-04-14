import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CenteredHeader } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { orderService } from '@/services/api/order.service';
import { vendorService } from '@/services/api/vendor.service';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { OrderDetail } from '@/types/api.types';

const SHIPPING_FEE = 50;

type OrderRole = 'customer' | 'vendor';

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    try {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return value;
    }
};

const formatMoney = (value: string | number) => {
    const numberValue = Number(value || 0);
    return `${numberValue.toLocaleString('en-EG')} EGP`;
};

const normalizeStatus = (status?: string) => String(status || '').toLowerCase();

const getStatusPalette = (status: string, colors: any) => {
    const value = normalizeStatus(status);
    if (value === 'delivered') return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981' };
    if (value === 'shipped') return { bg: 'rgba(249,115,22,0.2)', fg: '#F97316' };
    if (value === 'processing') return { bg: 'rgba(99,102,241,0.2)', fg: '#818CF8' };
    if (value === 'cancelled') return { bg: 'rgba(239,83,80,0.2)', fg: colors.error };
    return { bg: colors.pinkGlow, fg: colors.pink };
};

const getVendorPrimaryAction = (status: string) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'pending') return { label: 'Mark as Processing', nextStatus: 'processing' };
    if (normalized === 'processing') return { label: 'Mark as Shipped', nextStatus: 'shipped' };
    if (normalized === 'shipped') return { label: 'Mark as Delivered', nextStatus: 'delivered' };
    return null;
};

const canVendorCancel = (status: string) => {
    const normalized = normalizeStatus(status);
    return normalized === 'pending' || normalized === 'processing';
};

export default function OrderDetailScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { showToast } = useToast();
    const { user } = useAuth();
    const params = useLocalSearchParams<{ id?: string; role?: string }>();

    const orderId = Number(params.id || 0);
    const role = ((params.role as OrderRole) || (user?.role === 'vendor' ? 'vendor' : 'customer')) as OrderRole;

    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [order, setOrder] = useState<OrderDetail | null>(null);

    const subtotal = useMemo(() => Number(order?.total_amount || 0), [order?.total_amount]);
    const totalWithShipping = subtotal + SHIPPING_FEE;

    const loadOrder = useCallback(async () => {
        if (!orderId) {
            showToast('error', 'Invalid Order', 'Order id is missing.');
            router.back();
            return;
        }

        try {
            setLoading(true);
            const response = await orderService.getOrderById(orderId);
            if (!response.success || !response.data) {
                showToast('error', 'Order Error', response.message || 'Unable to load order details.');
                return;
            }
            setOrder(response.data);
        } catch {
            showToast('error', 'Order Error', 'Unable to load order details.');
        } finally {
            setLoading(false);
        }
    }, [orderId, router, showToast]);

    useFocusEffect(
        useCallback(() => {
            loadOrder();
        }, [loadOrder])
    );

    const handleVendorStatusUpdate = async (status: string) => {
        if (!order) return;

        try {
            setUpdatingStatus(true);
            const response = await vendorService.updateOrderStatus(order.order_id, status);
            if (!response.success) {
                showToast('error', 'Status Update', response.message || 'Could not update order status.');
                return;
            }
            showToast('success', 'Status Updated', `Order status changed to ${status}.`);
            await loadOrder();
        } catch {
            showToast('error', 'Status Update', 'Could not update order status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const statusPalette = getStatusPalette(order?.status || 'pending', colors);
    const primaryAction = getVendorPrimaryAction(order?.status || '');

    const timelineSteps = [
        { key: 'pending', label: 'Order Placed' },
        { key: 'processing', label: 'Processing' },
        { key: 'shipped', label: 'Shipped' },
        { key: 'delivered', label: 'Delivered' },
    ];

    const statusPosition: Record<string, number> = {
        pending: 0,
        processing: 1,
        shipped: 2,
        delivered: 3,
    };

    const currentPosition = statusPosition[normalizeStatus(order?.status)] ?? 0;

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.pink} />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}> 
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Order not found.</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}> 
            <CenteredHeader title="Order Details" titleColor={colors.textPrimary} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}> 
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={[styles.orderId, { color: colors.textPrimary }]}>Order #{order.order_id}</Text>
                            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(order.order_date)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: statusPalette.bg }]}> 
                            <Text style={[styles.statusText, { color: statusPalette.fg }]}>{order.status}</Text>
                        </View>
                    </View>

                    <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>Preferred arrival: {formatDate(order.preferred_delivery_date)}</Text>
                    <Text style={[styles.deliveryText, { color: colors.textMuted }]}>Estimated: {formatDate(order.estimated_delivery_start)} - {formatDate(order.estimated_delivery_end)}</Text>
                </View>

                {role === 'customer' ? (
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}> 
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tracking</Text>
                        {timelineSteps.map((step, index) => {
                            const reached = currentPosition >= index;
                            const active = currentPosition === index;
                            return (
                                <View key={step.key} style={styles.timelineRow}>
                                    <View style={styles.timelineRailCol}>
                                        <View
                                            style={[
                                                styles.timelineDot,
                                                {
                                                    backgroundColor: reached ? colors.pink : colors.border,
                                                    borderColor: reached ? colors.pink : colors.border,
                                                },
                                            ]}
                                        >
                                            {reached ? <MaterialCommunityIcons name="check" size={13} color={colors.white} /> : null}
                                        </View>
                                        {index < timelineSteps.length - 1 ? (
                                            <View style={[styles.timelineLine, { backgroundColor: reached ? colors.pink : colors.border }]} />
                                        ) : null}
                                    </View>
                                    <View style={styles.timelineLabelCol}>
                                        <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : colors.textSecondary }]}>{step.label}</Text>
                                        <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{reached ? formatDate(order.order_date) : 'Pending'}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}> 
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Customer</Text>
                        <View style={styles.vendorCustomerRow}>
                            <View style={styles.vendorCustomerText}>
                                <Text style={[styles.customerName, { color: colors.textPrimary }]}>Customer Order</Text>
                                <Text style={[styles.customerHint, { color: colors.textSecondary }]}>Manage status and fulfillment from this view.</Text>
                            </View>
                            <View style={styles.iconGroup}>
                                <View style={[styles.iconBubble, { backgroundColor: colors.purpleGlow }]}>
                                    <MaterialCommunityIcons name="phone-outline" size={18} color={colors.textSecondary} />
                                </View>
                                <View style={[styles.iconBubble, { backgroundColor: colors.purpleGlow }]}>
                                    <MaterialCommunityIcons name="message-text-outline" size={18} color={colors.textSecondary} />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}> 
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Shipping Address</Text>
                    <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>{order.shipping_title || 'Shipping'}</Text>
                    <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                        {order.shipping_street || 'No street address'}{order.shipping_street && order.shipping_city ? ', ' : ''}{order.shipping_city || ''}
                    </Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}> 
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Order Items ({order.items.length})</Text>

                    {order.items.map((item) => (
                        <View key={item.order_item_id} style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.product_name}</Text>
                                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>Quantity: {item.quantity}</Text>
                            </View>
                            <Text style={[styles.itemPrice, { color: colors.pink }]}>{formatMoney(item.price_each)}</Text>
                        </View>
                    ))}

                    <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatMoney(subtotal)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Shipping</Text>
                        <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatMoney(SHIPPING_FEE)}</Text>
                    </View>

                    <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.summaryRow}>
                        <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: colors.pink }]}>{formatMoney(totalWithShipping)}</Text>
                    </View>
                </View>
            </ScrollView>

            {role === 'vendor' ? (
                <View style={[styles.footer, { backgroundColor: colors.background }]}> 
                    {primaryAction ? (
                        <Pressable
                            style={[styles.primaryButton, { backgroundColor: colors.pink, opacity: updatingStatus ? 0.7 : 1 }]}
                            onPress={() => handleVendorStatusUpdate(primaryAction.nextStatus)}
                            disabled={updatingStatus}
                        >
                            <Text style={styles.primaryButtonText}>{primaryAction.label}</Text>
                        </Pressable>
                    ) : null}

                    {canVendorCancel(order.status) ? (
                        <Pressable
                            style={[styles.secondaryButton, { borderColor: colors.error }]}
                            onPress={() => handleVendorStatusUpdate('cancelled')}
                            disabled={updatingStatus}
                        >
                            <Text style={[styles.secondaryButtonText, { color: colors.error }]}>Cancel Order</Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : (
                <View style={[styles.footerRow, { backgroundColor: colors.background }]}> 
                    <Pressable style={[styles.dualButton, { backgroundColor: colors.gradientStart }]} onPress={() => router.push('/support' as any)}>
                        <Text style={styles.dualButtonText}>Support</Text>
                    </Pressable>
                    {normalizeStatus(order.status) === 'delivered' ? (
                        <Pressable style={[styles.dualButton, { backgroundColor: colors.gradientEnd }]}>
                            <Text style={styles.dualButtonText}>Review</Text>
                        </Pressable>
                    ) : null}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
    },
    content: {
        padding: Spacing.md,
        paddingBottom: 180,
        gap: Spacing.md,
    },
    card: {
        borderWidth: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.xs,
    },
    orderId: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    orderDate: {
        marginTop: 2,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
    },
    statusBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
        textTransform: 'capitalize',
    },
    deliveryText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
        marginTop: 2,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
        marginBottom: Spacing.sm,
    },
    timelineRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    timelineRailCol: {
        alignItems: 'center',
        width: 24,
    },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timelineLine: {
        width: 2,
        height: 28,
        marginVertical: 3,
    },
    timelineLabelCol: {
        flex: 1,
        paddingBottom: Spacing.sm,
    },
    timelineLabel: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
    },
    timelineDate: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
        marginTop: 1,
    },
    vendorCustomerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    vendorCustomerText: {
        flex: 1,
    },
    customerName: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
    },
    customerHint: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    iconGroup: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    iconBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressTitle: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    addressText: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    itemName: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    itemQty: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    itemPrice: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    summaryDivider: {
        height: 1,
        marginBottom: Spacing.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    summaryLabel: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.md,
    },
    summaryValue: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
    },
    totalLabel: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xl,
    },
    totalValue: {
        fontFamily: Fonts.extraBold,
        fontSize: FontSizes.xxl,
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.lg,
        gap: Spacing.sm,
    },
    footerRow: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.lg,
    },
    primaryButton: {
        minHeight: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: Fonts.bold,
        color: '#FFFFFF',
        fontSize: FontSizes.md,
    },
    secondaryButton: {
        minHeight: 46,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    secondaryButtonText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
    },
    dualButton: {
        flex: 1,
        minHeight: 48,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dualButtonText: {
        fontFamily: Fonts.semiBold,
        color: '#FFFFFF',
        fontSize: FontSizes.md,
    },
});
