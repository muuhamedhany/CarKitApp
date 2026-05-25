import {
    MaterialCommunityIcons
} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import {
    useFocusEffect,
    useLocalSearchParams,
    useRouter
} from 'expo-router';
import {
    useCallback,
    useMemo,
    useState
} from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CenteredHeader, GetDirectionsButton, GlassView, GradientButton, OutlinedButton } from '@/components';
import Text from '@/components/common/LocalizedText';
import { ReviewModal } from '@/components/ReviewModal';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { orderService } from '@/services/api/order.service';
import { reviewService } from '@/services/api/review.service';
import { vendorService } from '@/services/api/vendor.service';
import { OrderDetail } from '@/types/api.types';

const SHIPPING_FEE = 50;

type OrderRole = 'customer' | 'vendor';
type TFunction = ReturnType<typeof useTranslation>['t'];

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    try {
        const date = new Date(value);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return value;
    }
};

const formatMoney = (value: string | number, currency: string) => {
    const numberValue = Number(value || 0);
    return `${numberValue.toLocaleString('en-EG')} ${currency}`;
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

const formatMinutes = (value: number | null | undefined, labels: { minutesShort: string; hoursShort: string; minutesCompact: string }) => {
    const minutes = Number(value || 0);
    if (minutes < 60) return `${minutes} ${labels.minutesShort}`;
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder ? `${hours}${labels.hoursShort} ${remainder}${labels.minutesCompact}` : `${hours}${labels.hoursShort}`;
};

const normalizeStatus = (status?: string) => String(status || '').toLowerCase();

const getStatusPalette = (status: string, colors: any) => {
    const value = normalizeStatus(status);
    if (value === 'delivered') return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981' };
    if (value === 'ready_for_pickup' || value === 'in_transit') return { bg: 'rgba(249,115,22,0.2)', fg: '#F97316' };
    if (value === 'processing') return { bg: 'rgba(99,102,241,0.2)', fg: '#818CF8' };
    if (value === 'cancelled') return { bg: 'rgba(239,83,80,0.2)', fg: colors.error };
    if (value === 'return_requested') return { bg: 'rgba(245,158,11,0.2)', fg: '#F59E0B' };
    if (value === 'returned') return { bg: 'rgba(107,114,128,0.2)', fg: '#6B7280' };
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
    if (normalized === 'return_requested') return 'Return Requested';
    if (normalized === 'returned') return 'Returned';
    return 'Pending';
};

const getStatusLabelKey = (status: string, isWorkshopFitting: boolean, role: OrderRole) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'ready_for_customer') return 'orderStatus.readyForCustomer';
    if (normalized === 'ready_for_pickup') {
        if (isWorkshopFitting) return 'orderStatus.readyForCustomer';
        return role === 'vendor' ? 'orderStatus.readyForDriver' : 'orderStatus.readyForDelivery';
    }
    if (normalized === 'processing') {
        return isWorkshopFitting ? 'orderStatus.installationInProgress' : 'orderStatus.processing';
    }
    if (normalized === 'in_transit') return 'orderStatus.inTransit';
    if (normalized === 'delivered') return isWorkshopFitting ? 'orderStatus.readyForCustomer' : 'orderStatus.delivered';
    if (normalized === 'cancelled') return 'filter.cancelled';
    if (normalized === 'return_requested') return 'orderStatus.returnRequested';
    if (normalized === 'returned') return 'orderStatus.returned';
    return 'filter.pending';
};

const getCustomerStatusNote = (order: OrderDetail, isWorkshopFitting: boolean, hasQueue: boolean, t: TFunction) => {
    const status = normalizeStatus(order.status);

    if (isWorkshopFitting) {
        if (status === 'processing') return t('order.details.installationInProgressNote');
        if (status === 'ready_for_pickup' || status === 'delivered') return t('order.details.installationCompleteNote');
        if (status === 'cancelled') return t('order.details.workshopCancelledNote');
        if (hasQueue && order.queue?.show_up_at) return t('order.details.showUp', { time: formatQueueTime(order.queue.show_up_at) });
        return t('order.details.estimatedFitting', {
            start: formatDate(order.estimated_delivery_start),
            end: formatDate(order.estimated_delivery_end),
        });
    }

    if (status === 'ready_for_pickup') return t('order.details.driverPickupNote');
    if (status === 'in_transit') return t('order.details.withDriverNote');
    if (status === 'delivered') return t('order.details.deliveredNote');
    if (status === 'cancelled') return t('order.details.deliveryCancelledNote');
    return t('order.details.estimatedDelivery', {
        start: formatDate(order.estimated_delivery_start),
        end: formatDate(order.estimated_delivery_end),
    });
};

const getVendorPrimaryAction = (status: string, isWorkshopFitting: boolean) => {
    const normalized = normalizeStatus(status);
    if (normalized === 'pending') {
        return isWorkshopFitting
            ? { labelKey: 'order.details.startInstallation', nextStatus: 'processing', icon: 'wrench-outline' }
            : { labelKey: 'order.details.startPreparing', nextStatus: 'processing', icon: 'progress-clock' };
    }
    if (normalized === 'processing') {
        return isWorkshopFitting
            ? { labelKey: 'order.details.readyForCustomer', nextStatus: 'ready_for_customer', icon: 'check-circle-outline' }
            : { labelKey: 'order.details.readyForDriver', nextStatus: 'ready_for_pickup', icon: 'package-check' };
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
    const { t } = useTranslation();
    const currencySuffix = t('common.currency.egp');
    const minutesShort = t('common.minutesShort');
    const hoursShort = t('common.hoursShort');
    const minutesCompact = t('common.minutesCompact');
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
    const normalizedDisplayStatus = normalizeStatus(order?.status || 'pending').replace(/-/g, '_');
    const displayStatus = t(`status.${normalizedDisplayStatus}`, {
        defaultValue: getStatusLabel(order?.status || 'pending', isWorkshopFitting, role),
    });
    const customerStatusNote = order ? getCustomerStatusNote(order, isWorkshopFitting, showCustomerWorkshopQueue, t) : '';

    const loadOrder = useCallback(async () => {
        if (!orderId) {
            showToast('error', t('order.details.invalidTitle'), t('order.details.invalidMessage'));
            router.back();
            return;
        }

        try {
            setLoading(true);
            const response = await orderService.getOrderById(orderId);
            if (!response.success || !response.data) {
                showToast('error', t('order.details.errorTitle'), response.message || t('order.details.loadError'));
                return;
            }
            setOrder(response.data);
        } catch {
            showToast('error', t('order.details.errorTitle'), t('order.details.loadError'));
        } finally {
            setLoading(false);
        }
    }, [orderId, router, showToast, t]);

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
                showToast('error', t('order.details.statusUpdate'), response.message || t('order.details.updateFailed'));
                return;
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast('success', t('common.updated'), t('order.details.statusUpdated', {
                status: t(getStatusLabelKey(status, isWorkshopFitting, role), {
                    defaultValue: getStatusLabel(status, isWorkshopFitting, role),
                }),
            }));
            await loadOrder();
        } catch {
            showToast('error', t('order.details.statusUpdate'), t('order.details.updateFailed'));
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleCustomerCancelOrder = () => {
        if (!order) return;
        if (!canCustomerCancel(order.status)) {
            showToast('warning', t('order.details.cancelUnavailable'), t('order.details.cancelUnavailableMessage'));
            return;
        }
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        Alert.alert(
            t('order.details.cancelOrder'),
            t('order.details.cancelConfirm'),
            [
                { text: t('order.details.keepOrder'), style: 'cancel' },
                {
                    text: t('order.details.cancelOrder'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUpdatingStatus(true);
                            const response = await orderService.cancelOrder(order.order_id);
                            if (!response.success) {
                                showToast('error', t('order.details.cancelFailed'), response.message || t('order.details.cancelFailedMessage'));
                                return;
                            }
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            showToast('success', t('order.details.cancelledTitle'), t('order.details.cancelledMessage'));
                            await loadOrder();
                        } catch {
                            showToast('error', t('order.details.cancelFailed'), t('order.details.cancelFailedMessage'));
                        } finally {
                            setUpdatingStatus(false);
                        }
                    },
                },
            ]
        );
    };

    const isEligibleForReturn = useMemo(() => {
        if (!order || role !== 'customer') return false;
        if (isWorkshopFitting) return false;
        if (normalizeStatus(order.status) !== 'delivered') return false;
        
        const orderDate = new Date(order.order_date);
        const deliveryDate = order.delivered_at ? new Date(order.delivered_at) : orderDate;
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - deliveryDate.getTime());
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        return diffDays <= 14;
    }, [order, role, isWorkshopFitting]);

    const handleReturnOrder = () => {
        if (!order) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        Alert.alert(
            t('order.details.returnOrder'),
            t('order.details.returnConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('order.details.returnOrder'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUpdatingStatus(true);
                            const response = await orderService.returnOrder(order.order_id);
                            if (!response.success) {
                                showToast('error', t('order.details.returnFailed'), response.message || t('order.details.returnFailedMessage'));
                                return;
                            }
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            showToast('success', t('order.details.returnOrder'), t('order.details.returnSuccess'));
                            await loadOrder();
                        } catch {
                            showToast('error', t('order.details.returnFailed'), t('order.details.returnFailedMessage'));
                        } finally {
                            setUpdatingStatus(false);
                        }
                    },
                },
            ]
        );
    };

    const handleVendorReturnAction = (action: 'approve' | 'reject') => {
        if (!order) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        const isApprove = action === 'approve';
        const nextStatus = isApprove ? 'returned' : 'delivered';
        const title = t(isApprove ? 'order.details.approveReturn' : 'order.details.rejectReturn');
        const confirmMsg = t(isApprove ? 'order.details.approveReturnConfirm' : 'order.details.rejectReturnConfirm');

        Alert.alert(
            title,
            confirmMsg,
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: title,
                    style: isApprove ? 'default' : 'destructive',
                    onPress: () => handleVendorStatusUpdate(nextStatus),
                },
            ]
        );
    };

    const statusPalette = getStatusPalette(order?.status || 'pending', colors);
    const primaryAction = getVendorPrimaryAction(order?.status || '', isWorkshopFitting);

    const customerDeliveryTimelineSteps = [
        { key: 'pending', labelKey: 'orderStatus.orderPlaced', icon: 'package-variant' },
        { key: 'processing', labelKey: 'orderStatus.processing', icon: 'cog-outline' },
        { key: 'ready_for_pickup', labelKey: 'orderStatus.readyForDelivery', icon: 'package-check' },
        { key: 'in_transit', labelKey: 'orderStatus.inTransit', icon: 'truck-fast-outline' },
        { key: 'delivered', labelKey: 'orderStatus.delivered', icon: 'check-all' },
    ];
    const customerWorkshopTimelineSteps = [
        { key: 'pending', labelKey: 'orderStatus.orderPlaced', icon: 'package-variant' },
        { key: 'processing', labelKey: 'orderStatus.installationInProgress', icon: 'car-wrench' },
        { key: 'delivered', labelKey: 'orderStatus.readyForCustomer', icon: 'check-circle-outline' },
    ];
    const vendorWorkshopTimelineSteps = [
        { key: 'pending', labelKey: 'orderStatus.orderReceived', icon: 'package-variant' },
        { key: 'processing', labelKey: 'orderStatus.installationInProgress', icon: 'car-wrench' },
        { key: 'delivered', labelKey: 'orderStatus.readyForCustomer', icon: 'check-circle-outline' },
    ];
    const vendorDeliveryTimelineSteps = [
        { key: 'pending', labelKey: 'orderStatus.orderReceived', icon: 'package-variant' },
        { key: 'processing', labelKey: 'orderStatus.preparingItems', icon: 'package-variant-closed' },
        { key: 'ready_for_pickup', labelKey: 'orderStatus.readyForDriverPickup', icon: 'package-check' },
        { key: 'in_transit', labelKey: 'orderStatus.withDriver', icon: 'truck-fast-outline' },
        { key: 'delivered', labelKey: 'orderStatus.deliveredToCustomer', icon: 'check-all' },
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
    const customerAddressText = `${order?.shipping_street || t('order.details.noStreetAddress')}${order?.shipping_street && order?.shipping_city ? ', ' : ''}${order?.shipping_city || ''}`;

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
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('order.details.notFound')}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <CenteredHeader title={t('order.details.title')} titleColor={colors.textPrimary} />
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <View style={styles.headerRow}>
                                <View>
                                    <Text style={[styles.orderId, { color: colors.textPrimary }]}>{t('order.details.orderNumber', { id: order.order_id })}</Text>
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
                                                {t('order.details.fulfillment')}: {isWorkshopFitting ? t('order.details.workshopInstallation') : t('order.details.homeDelivery')}
                                            </Text>
                                        </View>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons name="calendar-clock-outline" size={14} color={colors.textMuted} />
                                            <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                                                {isWorkshopFitting ? t('order.details.customerFittingDay') : t('order.details.customerDeliveryDay')}: {formatDate(order.preferred_delivery_date)}
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
                                                    ? t('order.details.customerWorkshopInstruction')
                                                    : t('order.details.deliveryPrepInstruction')}
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.infoRow}>
                                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                                            <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                                                {isWorkshopFitting ? t('order.details.fittingDay') : t('order.details.preferredDeliveryDay')}: {formatDate(order.preferred_delivery_date)}
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
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('order.details.queue')}</Text>
                                </View>
                                <View style={styles.queueGrid}>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.pink }]}>#{order.queue.queue_number}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>{t('order.details.yourNumber')}</Text>
                                    </View>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.textPrimary }]}>{order.queue.people_before}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>{t('order.details.beforeYou')}</Text>
                                    </View>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.textPrimary }]}>{formatMinutes(order.queue.estimated_wait_minutes, { minutesShort, hoursShort, minutesCompact })}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>{t('order.details.estWait')}</Text>
                                    </View>
                                </View>
                                <View style={[styles.vendorPickupNote, { backgroundColor: colors.infoSoft }]}>
                                    <MaterialCommunityIcons name="map-marker-check-outline" size={16} color={colors.info} />
                                    <Text style={[styles.vendorPickupNoteText, { color: colors.textSecondary }]}>
                                        {t('order.details.queueFinishNote', {
                                            showUp: formatQueueTime(order.queue.show_up_at),
                                            finish: formatQueueTime(order.queue.estimated_finish_at),
                                        })}
                                    </Text>
                                </View>
                            </GlassView>
                        </Animated.View>
                    ) : null}

                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                {role === 'customer' ? t('order.details.tracking') : t('order.details.fulfillmentStatus')}
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
                                                <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : reached ? colors.textSecondary : colors.textMuted }]}>{t(step.labelKey)}</Text>
                                                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                                                    {reached ? (index === 0 ? formatDate(order.order_date) : active ? t('common.currentStep') : t('filter.completed')) : t('filter.pending')}
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
                                    {isWorkshopFitting ? t('orderDetail.workshopJob') : t('orderDetail.deliveryJob')}
                                </Text>
                                <View style={styles.vendorCustomerRow}>
                                    <View style={styles.vendorCustomerText}>
                                        <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                                            {order.customer_name || order.shipping_title || t('order.details.customer')}
                                        </Text>
                                        <Text style={[styles.customerHint, { color: colors.textSecondary }]}>
                                            {isWorkshopFitting
                                                ? t('orderDetail.workshopJobHint')
                                                : t('orderDetail.deliveryJobHint')}
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
                                        <Text style={[styles.vendorOpsLabel, { color: colors.textMuted }]}>{t('order.details.dueDay')}</Text>
                                        <Text style={[styles.vendorOpsValue, { color: colors.textPrimary }]}>{formatDate(order.preferred_delivery_date)}</Text>
                                    </View>
                                    <View style={[styles.vendorOpsTile, { backgroundColor: colors.purple + '10' }]}>
                                        <MaterialCommunityIcons name="basket-outline" size={16} color={colors.purple} />
                                        <Text style={[styles.vendorOpsLabel, { color: colors.textMuted }]}>{t('order.details.items')}</Text>
                                        <Text style={[styles.vendorOpsValue, { color: colors.textPrimary }]}>{order.items.length}</Text>
                                    </View>
                                </View>
                                <View style={[styles.vendorPickupNote, { backgroundColor: colors.infoSoft }]}>
                                    <MaterialCommunityIcons name="information-outline" size={16} color={colors.info} />
                                    <Text style={[styles.vendorPickupNoteText, { color: colors.textSecondary }]}>
                                        {isWorkshopFitting
                                            ? t('orderDetail.workshopActionHint')
                                            : t('orderDetail.deliveryActionHint')}
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
                                        ? (role === 'vendor' ? t('order.details.yourWorkshop') : t('order.details.workshopLocation'))
                                        : (role === 'vendor' ? t('order.details.customerDeliveryAddress') : t('order.details.shippingAddress'))}
                                </Text>
                            </View>
                            <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
                                <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                                    {isWorkshopFitting
                                        ? (order.queue?.center_name || order.vendor_name || t('order.details.vendorWorkshop'))
                                        : (role === 'vendor' ? (order.customer_name || order.shipping_title || t('order.details.customer')) : (order.shipping_title || t('order.details.defaultAddress')))}
                                </Text>
                                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                    {isWorkshopFitting
                                        ? (order.queue?.center_address || order.workshop_address || t('order.details.workshopAddressUnavailable'))
                                        : customerAddressText}
                                </Text>
                                {(order.shipping_building || order.shipping_apartment_floor) && (
                                    <Text style={[styles.addressSubtext, { color: colors.textSecondary }]}>
                                        {order.shipping_building ? t('order.details.building', { value: order.shipping_building }) : ''}
                                        {order.shipping_building && order.shipping_apartment_floor ? ' | ' : ''}
                                        {order.shipping_apartment_floor ? t('order.details.aptFloor', { value: order.shipping_apartment_floor }) : ''}
                                    </Text>
                                )}
                                {order.shipping_notes && (
                                    <View style={[styles.notesContainer, { borderTopColor: colors.cardBorder }]}>
                                        <Text style={[styles.notesLabel, { color: colors.textMuted }]}>{t('order.details.deliveryInstructions')}</Text>
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
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('orderDetail.orderItems', { count: order.items.length })}</Text>
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
                                                <Text style={[styles.itemQty, { color: colors.textSecondary }]}>{t('order.details.qty', { count: item.quantity })}</Text>
                                                <View style={styles.dot} />
                                                <Text style={[styles.itemPriceEach, { color: colors.textMuted }]}>{formatMoney(item.price_each, currencySuffix)} / {t('order.details.unit')}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.itemPrice, { color: colors.pink }]}>{formatMoney(Number(item.price_each) * item.quantity, currencySuffix)}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }]}>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('order.details.subtotal')}</Text>
                                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatMoney(subtotal, currencySuffix)}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                                        {isWorkshopFitting ? t('order.details.workshopFitting') : t('order.details.shipping')}
                                    </Text>
                                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                                        {formatMoney(isWorkshopFitting ? workshopFittingFee : SHIPPING_FEE, currencySuffix)}
                                    </Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('order.details.grandTotal')}</Text>
                                    <Text style={[styles.totalValue, { color: colors.pink }]}>{formatMoney(totalWithShipping, currencySuffix)}</Text>
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
                        {normalizeStatus(order.status) === 'return_requested' ? (
                            order.delivery_status === 'delivered' ? (
                                <>
                                    <GradientButton
                                        title={t('order.details.approveReturn')}
                                        onPress={() => handleVendorReturnAction('approve')}
                                        loading={updatingStatus}
                                        style={{ flex: 1 }}
                                        icon="check-circle-outline"
                                    />
                                    <OutlinedButton
                                        title={t('order.details.rejectReturn')}
                                        onPress={() => handleVendorReturnAction('reject')}
                                        disabled={updatingStatus}
                                        textColor={colors.error}
                                        borderColor={colors.error}
                                        style={{ flex: 1 }}
                                    />
                                </>
                            ) : (
                                <View style={[styles.reviewedBadge, { backgroundColor: colors.infoSoft, flex: 1 }]}>
                                    <MaterialCommunityIcons name="truck-delivery-outline" size={18} color={colors.info} />
                                    <Text style={[styles.reviewedText, { color: colors.info, marginLeft: 8 }]}>
                                        {order.delivery_status === 'assigned'
                                            ? t('order.details.returnInTransit')
                                            : t('order.details.returnPendingPickup')}
                                    </Text>
                                </View>
                            )
                        ) : (
                            <>
                                {primaryAction ? (
                                    <GradientButton
                                        title={t(primaryAction.labelKey)}
                                        onPress={() => handleVendorStatusUpdate(primaryAction.nextStatus)}
                                        loading={updatingStatus}
                                        style={{ flex: 1 }}
                                        icon={primaryAction.icon as any}
                                    />
                                ) : null}
                                {canVendorCancel(order.status) ? (
                                    <OutlinedButton
                                        title={t('common.cancel')}
                                        onPress={() => handleVendorStatusUpdate('cancelled')}
                                        disabled={updatingStatus}
                                        textColor={colors.error}
                                        borderColor={colors.error}
                                        style={{ flex: 1 }}
                                    />
                                ) : null}
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.actionsContainer}>
                        <GradientButton
                            title={t('common.support')}
                            onPress={() => router.push('/support' as any)}
                            style={{ flex: 1 }}
                            icon="chat-question-outline"
                        />
                        {canCustomerCancel(order.status) ? (
                            <OutlinedButton
                                title={t('order.details.cancelOrder')}
                                onPress={handleCustomerCancelOrder}
                                disabled={updatingStatus}
                                textColor={colors.error}
                                borderColor={colors.error}
                                style={{ flex: 1 }}
                            />
                        ) : null}
                        {normalizeStatus(order.status) === 'delivered' && !isReviewed ? (
                            <GradientButton
                                title={t('common.rate')}
                                onPress={() => setReviewModalVisible(true)}
                                style={{ flex: 1 }}
                                icon="star-outline"
                            />
                        ) : isReviewed ? (
                            <View style={[styles.reviewedBadge, { backgroundColor: colors.success + '20' }]}>
                                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />
                                <Text style={[styles.reviewedText, { color: colors.success }]}>{t('common.reviewed')}</Text>
                            </View>
                        ) : null}
                        {isEligibleForReturn ? (
                            <OutlinedButton
                                title={t('order.details.returnOrder')}
                                onPress={handleReturnOrder}
                                disabled={updatingStatus}
                                textColor={colors.warning}
                                borderColor={colors.warning}
                                style={{ flex: 1 }}
                            />
                        ) : null}
                    </View>
                ))}
            </GlassView>

            {order && (
                <ReviewModal
                    visible={reviewModalVisible}
                    onClose={() => setReviewModalVisible(false)}
                    entityId={order.vendor_id_fk || 0}
                    entityName={order.vendor_name || t('review.vendor')}
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
