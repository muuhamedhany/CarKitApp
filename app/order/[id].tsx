import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CenteredHeader, GetDirectionsButton, GlassView, GradientButton, OutlinedButton } from '@/components';
import Text from '@/components/common/LocalizedText';
import { ReviewModal } from '@/components/ReviewModal';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { orderService } from '@/services/api/order.service';
import { reviewService } from '@/services/api/review.service';
import { vendorService } from '@/services/api/vendor.service';
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

const formatQueueTime = (value?: string | null) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    } catch {
        return value;
    }
};

const formatMinutes = (value?: number | null) => {
    const minutes = Number(value || 0);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const normalizeStatus = (status?: string) => String(status || '').toLowerCase();

const getStatusPalette = (status: string, colors: any) => {
    const value = normalizeStatus(status);
    if (value === 'delivered') return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981' };
    if (value === 'ready_for_pickup' || value === 'in_transit') return { bg: 'rgba(249,115,22,0.2)', fg: '#F97316' };
    if (value === 'processing') return { bg: 'rgba(99,102,241,0.2)', fg: '#818CF8' };
    if (value === 'cancelled') return { bg: 'rgba(239,83,80,0.2)', fg: colors.error };
    return { bg: colors.pink + '20', fg: colors.pink };
};

const getStatusLabel = (status: string, isWorkshopFitting: boolean, role: OrderRole) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'ready_for_customer') return 'Ready for Customer';
    if (normalized === 'ready_for_pickup') {
        if (isWorkshopFitting) return 'Ready for Customer';
        return role === 'vendor' ? 'Ready for Driver' : 'Ready for Delivery';
    }
    if (normalized === 'processing') {
        return isWorkshopFitting ? 'Installation in Progress' : 'Processing';
    }
    if (normalized === 'in_transit') return 'In Transit';
    if (normalized === 'delivered') return isWorkshopFitting ? 'Ready for Customer' : 'Delivered';
    if (normalized === 'cancelled') return 'Cancelled';
    return 'Pending';
};

const getCustomerStatusNote = (order: OrderDetail, isWorkshopFitting: boolean, hasQueue: boolean) => {
    const status = normalizeStatus(order.status);

    if (isWorkshopFitting) {
        if (status === 'processing') return 'Installation is in progress at the vendor workshop.';
        if (status === 'ready_for_pickup' || status === 'delivered') return 'Installation is complete. The order is closed and ready for the customer.';
        if (status === 'cancelled') return 'This workshop installation order was cancelled.';
        if (hasQueue && order.queue?.show_up_at) return `Show up: ${formatQueueTime(order.queue.show_up_at)}`;
        return `Estimated fitting: ${formatDate(order.estimated_delivery_start)} - ${formatDate(order.estimated_delivery_end)}`;
    }

    if (status === 'ready_for_pickup') return 'The vendor has prepared the order for driver pickup.';
    if (status === 'in_transit') return 'Your order is with the driver.';
    if (status === 'delivered') return 'Your order has been delivered.';
    if (status === 'cancelled') return 'This delivery order was cancelled.';
    return `Estimated delivery: ${formatDate(order.estimated_delivery_start)} - ${formatDate(order.estimated_delivery_end)}`;
};

const getVendorPrimaryAction = (status: string, isWorkshopFitting: boolean) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'pending') {
        return isWorkshopFitting
            ? { label: 'Start Installation', nextStatus: 'processing', icon: 'wrench-outline' }
            : { label: 'Start Preparing', nextStatus: 'processing', icon: 'progress-clock' };
    }
    if (normalized === 'processing') {
        return isWorkshopFitting
            ? { label: 'Ready for Customer', nextStatus: 'ready_for_customer', icon: 'check-circle-outline' }
            : { label: 'Ready for Driver', nextStatus: 'ready_for_pickup', icon: 'package-check' };
    }
    return null;
};

const canVendorCancel = (status: string) => {
    const normalized = normalizeStatus(status);
    return normalized === 'pending' || normalized === 'processing';
};

const canCustomerCancel = (status: string) => {
    const normalized = normalizeStatus(status);
    return normalized === 'pending';
};

export default function OrderDetailScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();
    const { user } = useAuth();
    const params = useLocalSearchParams<{ id?: string; role?: string }>();

    const orderId = Number(params.id || 0);
    const role = ((params.role as OrderRole) || (user?.role === 'vendor' ? 'vendor' : 'customer')) as OrderRole;

    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [isReviewed, setIsReviewed] = useState(false);

    const orderAmount = useMemo(() => Number(order?.total_amount || 0), [order?.total_amount]);
    const itemSubtotal = useMemo(() => {
        if (!order?.items?.length) return 0;
        return order.items.reduce((sum, item) => sum + (Number(item.price_each || 0) * Number(item.quantity || 0)), 0);
    }, [order?.items]);
    const isWorkshopFitting = order?.delivery_type === 'workshop_fitting' || order?.shipping_address_fk === null;
    const showCustomerWorkshopQueue = role === 'customer' && isWorkshopFitting && Boolean(order?.queue);
    const subtotal = itemSubtotal || orderAmount;
    const workshopFittingFee = isWorkshopFitting ? Math.max(0, orderAmount - subtotal) : 0;
    const totalWithShipping = isWorkshopFitting ? orderAmount : orderAmount + SHIPPING_FEE;
    const workshopLatitude = Number(order?.queue?.center_latitude ?? order?.workshop_latitude);
    const workshopLongitude = Number(order?.queue?.center_longitude ?? order?.workshop_longitude);
    const hasWorkshopCoordinates = Number.isFinite(workshopLatitude) && Number.isFinite(workshopLongitude);
    const displayStatus = getStatusLabel(order?.status || 'pending', isWorkshopFitting, role);
    const customerStatusNote = order ? getCustomerStatusNote(order, isWorkshopFitting, showCustomerWorkshopQueue) : '';

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

    const checkReviewStatus = useCallback(async () => {
        if (!orderId || role !== 'customer') return;
        try {
            const response = await reviewService.checkReviewStatus({ orderId });
            if (response.success && response.data) {
                setIsReviewed(response.data.reviewed);
            }
        } catch (error) {
            console.error('Error checking review status:', error);
        }
    }, [orderId, role]);

    useFocusEffect(
        useCallback(() => {
            loadOrder();
            checkReviewStatus();
        }, [loadOrder, checkReviewStatus])
    );

    const handleVendorStatusUpdate = async (status: string) => {
        if (!order) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            setUpdatingStatus(true);
            const response = await vendorService.updateOrderStatus(order.order_id, status);
            if (!response.success) {
                showToast('error', 'Status Update', response.message || 'Could not update order status.');
                return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast('success', 'Status Updated', `Order status changed to ${getStatusLabel(status, isWorkshopFitting, role)}.`);
            await loadOrder();
        } catch {
            showToast('error', 'Status Update', 'Could not update order status.');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleCustomerCancelOrder = () => {
        if (!order) return;
        if (!canCustomerCancel(order.status)) {
            showToast('warning', 'Cancel Unavailable', 'Orders can only be cancelled before processing starts.');
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'Keep Order', style: 'cancel' },
                {
                    text: 'Cancel Order',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUpdatingStatus(true);
                            const response = await orderService.cancelOrder(order.order_id);
                            if (!response.success) {
                                showToast('error', 'Cancel Failed', response.message || 'Could not cancel order.');
                                return;
                            }
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            showToast('success', 'Order Cancelled', 'Your order has been cancelled successfully.');
                            await loadOrder();
                        } catch {
                            showToast('error', 'Cancel Failed', 'Could not cancel order.');
                        } finally {
                            setUpdatingStatus(false);
                        }
                    },
                },
            ]
        );
    };

    const statusPalette = getStatusPalette(order?.status || 'pending', colors);
    const primaryAction = getVendorPrimaryAction(order?.status || '', isWorkshopFitting);

    const customerDeliveryTimelineSteps = [
        { key: 'pending', label: 'Order Placed', icon: 'package-variant' },
        { key: 'processing', label: 'Processing', icon: 'cog-outline' },
        { key: 'ready_for_pickup', label: 'Ready for Delivery', icon: 'package-check' },
        { key: 'in_transit', label: 'In Transit', icon: 'truck-fast-outline' },
        { key: 'delivered', label: 'Delivered', icon: 'check-all' },
    ];
    const customerWorkshopTimelineSteps = [
        { key: 'pending', label: 'Order Placed', icon: 'package-variant' },
        { key: 'processing', label: 'Installation In Progress', icon: 'car-wrench' },
        { key: 'delivered', label: 'Ready for Customer', icon: 'check-circle-outline' },
    ];
    const vendorWorkshopTimelineSteps = [
        { key: 'pending', label: 'Order Received', icon: 'package-variant' },
        { key: 'processing', label: 'Installation In Progress', icon: 'car-wrench' },
        { key: 'delivered', label: 'Ready for Customer', icon: 'check-circle-outline' },
    ];
    const vendorDeliveryTimelineSteps = [
        { key: 'pending', label: 'Order Received', icon: 'package-variant' },
        { key: 'processing', label: 'Preparing Items', icon: 'package-variant-closed' },
        { key: 'ready_for_pickup', label: 'Ready for Driver Pickup', icon: 'package-check' },
        { key: 'in_transit', label: 'With Driver', icon: 'truck-fast-outline' },
        { key: 'delivered', label: 'Delivered to Customer', icon: 'check-all' },
    ];
    const timelineSteps = role === 'vendor'
        ? (isWorkshopFitting ? vendorWorkshopTimelineSteps : vendorDeliveryTimelineSteps)
        : (isWorkshopFitting ? customerWorkshopTimelineSteps : customerDeliveryTimelineSteps);

    const customerStatusPosition: Record<string, number> = {
        pending: 0,
        processing: 1,
        ready_for_pickup: 2,
        in_transit: 3,
        delivered: 4,
    };
    const vendorWorkshopStatusPosition: Record<string, number> = {
        pending: 0,
        processing: 1,
        ready_for_pickup: 2,
        delivered: 2,
    };
    const customerWorkshopStatusPosition: Record<string, number> = {
        pending: 0,
        processing: 1,
        ready_for_pickup: 2,
        delivered: 2,
    };
    const statusPosition = isWorkshopFitting
        ? (role === 'vendor' ? vendorWorkshopStatusPosition : customerWorkshopStatusPosition)
        : customerStatusPosition;

    const currentPosition = statusPosition[normalizeStatus(order?.status)] ?? 0;
    const customerAddressText = `${order?.shipping_street || 'No street address'}${order?.shipping_street && order?.shipping_city ? ', ' : ''}${order?.shipping_city || ''}`;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : !order ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Order not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <CenteredHeader title="Order Details" titleColor={colors.textPrimary} />
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <View style={styles.headerRow}>
                                <View>
                                    <Text style={[styles.orderId, { color: colors.textPrimary }]}>Order #{order.order_id}</Text>
                                    <Text style={[styles.orderDate, { color: colors.textSecondary }]}>{formatDate(order.order_date)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusPalette.bg }]}>
                                    <Text style={[styles.statusText, { color: statusPalette.fg }]}>{displayStatus}</Text>
                                </View>
                            </View>

                            <View style={[styles.deliveryInfo, { borderTopColor: colors.cardBorder }]}>
                                {role === 'vendor' ? (
                                    <>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons
                                                name={isWorkshopFitting ? 'car-wrench' : 'truck-delivery-outline'}
                                                size={14}
                                                color={colors.textMuted}
                                            />
                                            <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                                                Fulfillment: {isWorkshopFitting ? 'Workshop installation' : 'Home delivery'}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons name="calendar-clock-outline" size={14} color={colors.textMuted} />
                                            <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                                                {isWorkshopFitting ? 'Customer fitting day' : 'Customer delivery day'}: {formatDate(order.preferred_delivery_date)}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons
                                                name={isWorkshopFitting ? 'account-wrench-outline' : 'package-variant-closed'}
                                                size={14}
                                                color={colors.textMuted}
                                            />
                                            <Text style={[styles.deliveryText, { color: colors.textMuted }]}>
                                                {isWorkshopFitting
                                                    ? 'Customer comes to your workshop. No delivery handoff needed.'
                                                    : 'Prepare the order and mark it ready when driver pickup can happen.'}
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                                            <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                                                {isWorkshopFitting ? 'Fitting day' : 'Preferred delivery day'}: {formatDate(order.preferred_delivery_date)}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons
                                                name={isWorkshopFitting ? 'map-marker-check-outline' : 'calendar-range'}
                                                size={14}
                                                color={colors.textMuted}
                                            />
                                            <Text style={[styles.deliveryText, { color: colors.textMuted }]}>
                                                {customerStatusNote}
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </GlassView>
                    </Animated.View>

                    {showCustomerWorkshopQueue && order.queue ? (
                        <Animated.View entering={FadeInDown.delay(150).springify()}>
                            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons name="account-clock-outline" size={20} color={colors.pink} />
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Workshop Queue</Text>
                                </View>
                                <View style={styles.queueGrid}>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.pink }]}>#{order.queue.queue_number}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>Your number</Text>
                                    </View>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.textPrimary }]}>{order.queue.people_before}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>Before you</Text>
                                    </View>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.textPrimary }]}>{formatMinutes(order.queue.estimated_wait_minutes)}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>Est. wait</Text>
                                    </View>
                                </View>
                                <View style={[styles.vendorPickupNote, { backgroundColor: colors.infoSoft }]}>
                                    <MaterialCommunityIcons name="map-marker-check-outline" size={16} color={colors.info} />
                                    <Text style={[styles.vendorPickupNoteText, { color: colors.textSecondary }]}>
                                        Show up around {formatQueueTime(order.queue.show_up_at)}. Fitting is expected to finish by {formatQueueTime(order.queue.estimated_finish_at)}.
                                    </Text>
                                </View>
                            </GlassView>
                        </Animated.View>
                    ) : null}

                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                {role === 'customer' ? 'Tracking' : 'Fulfillment Status'}
                            </Text>
                            <View style={styles.timelineContainer}>
                                {timelineSteps.map((step, index) => {
                                    const reached = currentPosition >= index;
                                    const active = currentPosition === index;
                                    return (
                                        <View key={step.key} style={styles.timelineRow}>
                                            <View style={styles.timelineRailCol}>
                                                <View style={[
                                                    styles.timelineDot,
                                                    {
                                                        backgroundColor: reached ? colors.pink : colors.cardBorder,
                                                        borderColor: reached ? colors.pink : colors.cardBorder,
                                                    },
                                                ]}>
                                                    <MaterialCommunityIcons
                                                        name={step.icon as any}
                                                        size={12}
                                                        color={reached ? colors.white : colors.textMuted}
                                                    />
                                                </View>
                                                {index < timelineSteps.length - 1 ? (
                                                    <View style={[
                                                        styles.timelineLine,
                                                        { backgroundColor: reached ? colors.pink : colors.cardBorder, opacity: reached ? 1 : 0.3 }
                                                    ]} />
                                                ) : null}
                                            </View>
                                            <View style={styles.timelineLabelCol}>
                                                <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : reached ? colors.textSecondary : colors.textMuted }]}>{step.label}</Text>
                                                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                                                    {reached ? (index === 0 ? formatDate(order.order_date) : active ? 'Current step' : 'Completed') : 'Pending'}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </GlassView>
                    </Animated.View>

                    {role === 'vendor' && (
                        <Animated.View entering={FadeInDown.delay(300).springify()}>
                            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                    {isWorkshopFitting ? 'Workshop Job' : 'Delivery Job'}
                                </Text>
                                <View style={styles.vendorCustomerRow}>
                                    <View style={styles.vendorCustomerText}>
                                        <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                                            {order.customer_name || order.shipping_title || 'Customer'}
                                        </Text>
                                        <Text style={[styles.customerHint, { color: colors.textSecondary }]}>
                                            {isWorkshopFitting
                                                ? 'Install the ordered items when the customer arrives at your workshop.'
                                                : 'Pack the ordered items and prepare them for driver pickup.'}
                                        </Text>
                                    </View>
                                    <View style={styles.iconGroup}>
                                        <Pressable style={[styles.iconBubble, { backgroundColor: colors.pink + '15' }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                                            <MaterialCommunityIcons name="phone-outline" size={20} color={colors.pink} />
                                        </Pressable>
                                        <Pressable style={[styles.iconBubble, { backgroundColor: colors.purple + '15' }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                                            <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.purple} />
                                        </Pressable>
                                    </View>
                                </View>
                                <View style={styles.vendorOpsGrid}>
                                    <View style={[styles.vendorOpsTile, { backgroundColor: colors.pink + '10' }]}>
                                        <MaterialCommunityIcons name="calendar-check-outline" size={16} color={colors.pink} />
                                        <Text style={[styles.vendorOpsLabel, { color: colors.textMuted }]}>Due day</Text>
                                        <Text style={[styles.vendorOpsValue, { color: colors.textPrimary }]}>{formatDate(order.preferred_delivery_date)}</Text>
                                    </View>
                                    <View style={[styles.vendorOpsTile, { backgroundColor: colors.purple + '10' }]}>
                                        <MaterialCommunityIcons name="basket-outline" size={16} color={colors.purple} />
                                        <Text style={[styles.vendorOpsLabel, { color: colors.textMuted }]}>Items</Text>
                                        <Text style={[styles.vendorOpsValue, { color: colors.textPrimary }]}>{order.items.length}</Text>
                                    </View>
                                </View>
                                <View style={[styles.vendorPickupNote, { backgroundColor: colors.infoSoft }]}>
                                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.info} />
                                    <Text style={[styles.vendorPickupNoteText, { color: colors.textSecondary }]}>
                                        {isWorkshopFitting
                                            ? 'Use Start Installation when work begins, then Ready for Customer when fitting is finished.'
                                            : 'Use Start Preparing while packing, then Ready for Driver when the package can be picked up.'}
                                    </Text>
                                </View>
                            </GlassView>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                                    {isWorkshopFitting
                                        ? (role === 'vendor' ? 'Your Workshop' : 'Workshop Location')
                                        : (role === 'vendor' ? 'Customer Delivery Address' : 'Shipping Address')}
                                </Text>
                            </View>
                            <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
                                <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                                    {isWorkshopFitting
                                        ? (order.queue?.center_name || order.vendor_name || 'Vendor Workshop')
                                        : (role === 'vendor' ? (order.customer_name || order.shipping_title || 'Customer') : (order.shipping_title || 'Default Address'))}
                                </Text>
                                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                    {isWorkshopFitting
                                        ? (order.queue?.center_address || order.workshop_address || 'Workshop address unavailable')
                                        : customerAddressText}
                                </Text>
                                {(order.shipping_building || order.shipping_apartment_floor) && (
                                    <Text style={[styles.addressSubtext, { color: colors.textSecondary }]}>
                                        {order.shipping_building ? `Building: ${order.shipping_building}` : ''}
                                        {order.shipping_building && order.shipping_apartment_floor ? ' | ' : ''}
                                        {order.shipping_apartment_floor ? `Apt/Floor: ${order.shipping_apartment_floor}` : ''}
                                    </Text>
                                )}
                                {order.shipping_notes && (
                                    <View style={[styles.notesContainer, { borderTopColor: colors.cardBorder }]}>
                                        <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Delivery Instructions:</Text>
                                        <Text style={[styles.notesText, { color: colors.textSecondary }]}>{order.shipping_notes}</Text>
                                    </View>
                                )}
                                {isWorkshopFitting && hasWorkshopCoordinates ? (
                                    <View style={{ marginTop: Spacing.md }}>
                                        <GetDirectionsButton
                                            latitude={workshopLatitude}
                                            longitude={workshopLongitude}
                                            label={order.queue?.center_name || order.vendor_name || undefined}
                                        />
                                    </View>
                                ) : null}
                                {!isWorkshopFitting && order.shipping_latitude && order.shipping_longitude ? (
                                    <View style={{ marginTop: Spacing.md }}>
                                        <GetDirectionsButton
                                            latitude={order.shipping_latitude}
                                            longitude={order.shipping_longitude}
                                            label={order.shipping_street || undefined}
                                        />
                                    </View>
                                ) : null}
                            </View>
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(500).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="basket-outline" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Order Items ({order.items.length})</Text>
                            </View>

                            <View style={{ marginTop: Spacing.md }}>
                                {order.items.map((item, idx) => (
                                    <View key={item.order_item_id} style={[
                                        styles.itemRow,
                                        idx < order.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.cardBorder, paddingBottom: Spacing.md }
                                    ]}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.product_name}</Text>
                                            <View style={styles.qtyContainer}>
                                                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>Qty: {item.quantity}</Text>
                                                <View style={styles.dot} />
                                                <Text style={[styles.itemPriceEach, { color: colors.textMuted }]}>{formatMoney(item.price_each)} / unit</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.itemPrice, { color: colors.pink }]}>{formatMoney(Number(item.price_each) * item.quantity)}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }]}>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
                                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatMoney(subtotal)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                        {isWorkshopFitting ? 'Workshop fitting' : 'Shipping'}
                                    </Text>
                                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                                        {formatMoney(isWorkshopFitting ? workshopFittingFee : SHIPPING_FEE)}
                                    </Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Grand Total</Text>
                                    <Text style={[styles.totalValue, { color: colors.pink }]}>{formatMoney(totalWithShipping)}</Text>
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <View style={styles.spacer} />
                </ScrollView>
            )}

            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.footerContainer} {...{} as any}>
                {order && (role === 'vendor' ? (
                    <View style={styles.actionsContainer}>
                        {primaryAction ? (
                            <GradientButton
                                title={primaryAction.label}
                                onPress={() => handleVendorStatusUpdate(primaryAction.nextStatus)}
                                loading={updatingStatus}
                                style={{ flex: 1 }}
                                icon={primaryAction.icon as any}
                            />
                        ) : null}
                        {canVendorCancel(order.status) ? (
                            <OutlinedButton
                                title="Cancel"
                                onPress={() => handleVendorStatusUpdate('cancelled')}
                                disabled={updatingStatus}
                                textColor={colors.error}
                                borderColor={colors.error}
                                style={{ flex: 1 }}
                            />
                        ) : null}
                    </View>
                ) : (
                    <View style={styles.actionsContainer}>
                        <GradientButton
                            title="Support"
                            onPress={() => router.push('/support' as any)}
                            style={{ flex: 1 }}
                            icon="chat-question-outline"
                        />
                        {canCustomerCancel(order.status) ? (
                            <OutlinedButton
                                title="Cancel Order"
                                onPress={handleCustomerCancelOrder}
                                disabled={updatingStatus}
                                textColor={colors.error}
                                borderColor={colors.error}
                                style={{ flex: 1 }}
                            />
                        ) : null}
                        {normalizeStatus(order.status) === 'delivered' && !isReviewed ? (
                            <GradientButton
                                title="Rate"
                                onPress={() => setReviewModalVisible(true)}
                                style={{ flex: 1 }}
                                icon="star-outline"
                            />
                        ) : isReviewed ? (
                            <View style={[styles.reviewedBadge, { backgroundColor: colors.success + '20' }]}>
                                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />
                                <Text style={[styles.reviewedText, { color: colors.success }]}>Reviewed</Text>
                            </View>
                        ) : null}
                    </View>
                ))}
            </GlassView>

            {order && (
                <ReviewModal
                    visible={reviewModalVisible}
                    onClose={() => setReviewModalVisible(false)}
                    entityId={order.vendor_id_fk || 0}
                    entityName={order.vendor_name || 'Vendor'}
                    entityType="vendor"
                    orderId={order.order_id}
                    items={order.items.map(item => ({
                        id: item.product_id,
                        name: item.product_name,
                        type: 'product',
                        rating: 0,
                        comment: '',
                    }))}
                    onSuccess={() => {
                        setIsReviewed(true);
                        checkReviewStatus();
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    content: { padding: Spacing.md, paddingBottom: 180 },
    spacer: { height: 40 },

    orb: {
        position: 'absolute',
        width: 400,
        height: 400,
        borderRadius: 200,
        opacity: 0.4,
    },

    card: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, letterSpacing: 0.5 },
    orderDate: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 4, opacity: 0.7 },
    statusBadge: { maxWidth: 190, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
    statusText: { fontFamily: Fonts.bold, fontSize: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },

    deliveryInfo: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, gap: 6 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    deliveryText: { flex: 1, fontFamily: Fonts.medium, fontSize: 11 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
    sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, letterSpacing: 0.5, marginBottom: Spacing.md },

    timelineContainer: { marginTop: Spacing.xs },
    timelineRow: { flexDirection: 'row', gap: Spacing.md },
    timelineRailCol: { alignItems: 'center', width: 24 },
    timelineDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    timelineLine: { width: 2, flex: 1, marginVertical: -2, borderRadius: 999 },
    timelineLabelCol: { flex: 1, paddingBottom: Spacing.lg },
    timelineLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    timelineDate: { fontFamily: Fonts.medium, fontSize: 10, marginTop: 2, opacity: 0.6 },

    vendorCustomerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
    vendorCustomerText: { flex: 1 },
    customerName: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
    customerHint: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2, opacity: 0.7 },
    iconGroup: { flexDirection: 'row', gap: Spacing.sm },
    iconBubble: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    vendorOpsGrid: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    vendorOpsTile: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, gap: 4 },
    vendorOpsLabel: { fontFamily: Fonts.bold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
    vendorOpsValue: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
    vendorPickupNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.md },
    vendorPickupNoteText: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.xs },
    queueGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    queueStat: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    queueValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },
    queueLabel: { fontFamily: Fonts.medium, fontSize: 10, marginTop: 4, textTransform: 'uppercase' },

    addressTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
    addressText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, opacity: 0.8 },
    addressSubtext: { fontFamily: Fonts.medium, fontSize: 11, opacity: 0.6 },

    notesContainer: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1 },
    notesLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    notesText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, lineHeight: 20, opacity: 0.8 },

    itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    itemName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginBottom: 4 },
    qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    itemQty: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.2)' },
    itemPriceEach: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
    itemPrice: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

    summaryBox: { borderRadius: BorderRadius.lg, padding: Spacing.md, marginTop: Spacing.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    summaryLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.8 },
    summaryValue: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
    summaryDivider: { height: 1, marginVertical: Spacing.sm, opacity: 0.1 },
    totalLabel: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
    totalValue: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },

    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    actionsContainer: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
    reviewedBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: BorderRadius.lg,
    },
    reviewedText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
});
