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
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { bookingService, type Booking } from '@/services/api/booking.service';
import { reviewService } from '@/services/api/review.service';

type BookingDetail = Booking;

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

const normalizeStatus = (status?: string | null) => String(status || '').toLowerCase();

const getStatusPalette = (status: string, colors: any) => {
    const value = normalizeStatus(status);
    if (value === 'completed') return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981' };
    if (value === 'confirmed') return { bg: 'rgba(99,102,241,0.2)', fg: '#818CF8' };
    if (value === 'in-progress') return { bg: 'rgba(249,115,22,0.2)', fg: '#F97316' };
    if (value === 'cancelled') return { bg: 'rgba(239,83,80,0.2)', fg: colors.error };
    return { bg: colors.pink + '20', fg: colors.pink }; // pending / default
};

const getStatusLabel = (status: string, t: any) => {
    const normalized = normalizeStatus(status).replace(/-/g, '_');
    return t(`status.${normalized}`, {
        defaultValue: normalized.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    });
};

const canCancel = (status?: string | null) => {
    const normalized = normalizeStatus(status);
    return normalized === 'pending' || normalized === 'confirmed' || normalized === 'in_progress' || normalized === 'in-progress';
};

export default function BookingDetailScreen() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const currencySuffix = t('common.currency.egp');
    const minutesShort = t('common.minutesShort');
    const hoursShort = t('common.hoursShort');
    const minutesCompact = t('common.minutesCompact');
    const { id } = useLocalSearchParams<{ id?: string }>();

    const bookingId = Number(id || 0);

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [booking, setBooking] = useState<NonNullable<BookingDetail> | null>(null);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [isReviewed, setIsReviewed] = useState(false);

    const loadBooking = useCallback(async () => {
        if (!bookingId) {
            showToast('error', t('booking.details.invalidTitle'), t('booking.details.invalidMessage'));
            router.back();
            return;
        }

        try {
            setLoading(true);
            const response = await bookingService.getBookingById(bookingId);
            if (!response.success || !response.data) {
                showToast('error', t('booking.details.errorTitle'), response.message || t('booking.details.loadError'));
                return;
            }
            setBooking(response.data as NonNullable<BookingDetail>);
        } catch {
            showToast('error', t('booking.details.errorTitle'), t('booking.details.loadError'));
        } finally {
            setLoading(false);
        }
    }, [bookingId, router, showToast, t]);

    const checkReviewStatus = useCallback(async () => {
        if (!bookingId) return;
        try {
            const response = await reviewService.checkReviewStatus({ bookingId });
            if (response.success && response.data) {
                setIsReviewed(response.data.reviewed);
            }
        } catch (error) {
            console.error('Error checking review status:', error);
        }
    }, [bookingId]);

    useFocusEffect(
        useCallback(() => {
            loadBooking();
            checkReviewStatus();
        }, [loadBooking, checkReviewStatus])
    );

    const handleCancel = () => {
        if (!booking) return;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        Alert.alert(t('booking.details.cancelBooking'), t('booking.details.cancelConfirm'), [
            { text: t('booking.details.keepBooking'), style: 'cancel' },
            {
                text: t('booking.details.cancelBooking'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        setUpdating(true);
                        const response = await bookingService.cancelBooking(booking.booking_id);
                        if (!response.success) {
                            showToast('error', t('booking.details.cancelFailed'), response.message || t('booking.details.cancelFailedMessage'));
                            return;
                        }
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        showToast('success', t('booking.details.cancelledTitle'), t('booking.details.cancelledMessage'));
                        await loadBooking();
                    } catch {
                        showToast('error', t('booking.details.cancelFailed'), t('booking.details.cancelFailedMessage'));
                    } finally {
                        setUpdating(false);
                    }
                },
            },
        ]);
    };

    const statusPalette = useMemo(() => getStatusPalette(booking?.status || 'pending', colors), [booking?.status, colors]);
    const displayStatus = useMemo(() => getStatusLabel(booking?.status || 'pending', t), [booking?.status, t]);
    const serviceTitle = booking?.service_name || t('booking.details.service');

    const timelineSteps = useMemo(
        () => [
            { key: 'pending', labelKey: 'bookingStatus.pending', icon: 'calendar-clock' },
            { key: 'confirmed', labelKey: 'bookingStatus.confirmed', icon: 'check-circle-outline' },
            { key: 'in-progress', labelKey: 'bookingStatus.in_progress', icon: 'clock-outline' },
            { key: 'completed', labelKey: 'bookingStatus.completed', icon: 'flag-checkered' },
        ],
        []
    );

    const currentPosition = useMemo(() => {
        const normalized = normalizeStatus(booking?.status);
        const index = timelineSteps.findIndex((step) => step.key === normalized);
        return index >= 0 ? index : 0;
    }, [booking?.status, timelineSteps]);

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
            ) : !booking ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('booking.details.notFound')}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <CenteredHeader title={t('booking.details.title')} titleColor={colors.textPrimary} />

                    {/* Booking Basic Details Header Card */}
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <View style={styles.headerRow}>
                                <View>
                                    <Text style={[styles.bookingId, { color: colors.textPrimary }]}>{t('booking.details.bookingNumber', { id: booking.booking_id })}</Text>
                                    <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>{formatDate(booking.booking_date)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: statusPalette.bg }]}>
                                    <Text style={[styles.statusText, { color: statusPalette.fg }]}>{displayStatus}</Text>
                                </View>
                            </View>

                            <View style={[styles.deliveryInfo, { borderTopColor: colors.cardBorder }]}>
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons name="calendar-clock-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                                        {t('common.date')}: {formatDate(booking.booking_date)}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                                        {t('common.time')}: {booking.start_time || '-'}
                                    </Text>
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>

                    {/* Service Queue Details Card */}
                    {booking.queue ? (
                        <Animated.View entering={FadeInDown.delay(150).springify()}>
                            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons name="account-clock-outline" size={20} color={colors.pink} />
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('booking.details.serviceQueue') || 'Service Queue'}</Text>
                                </View>
                                <View style={styles.queueGrid}>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.pink }]}>#{booking.queue.queue_number}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>{t('booking.details.yourNumber')}</Text>
                                    </View>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.textPrimary }]}>{booking.queue.people_before}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>{t('booking.details.beforeYou')}</Text>
                                    </View>
                                    <View style={styles.queueStat}>
                                        <Text style={[styles.queueValue, { color: colors.textPrimary }]}>{formatMinutes(booking.queue.estimated_wait_minutes, { minutesShort, hoursShort, minutesCompact })}</Text>
                                        <Text style={[styles.queueLabel, { color: colors.textSecondary }]}>{t('booking.details.estWait')}</Text>
                                    </View>
                                </View>
                                <View style={[styles.vendorPickupNote, { backgroundColor: colors.infoSoft }]}>
                                    <MaterialCommunityIcons name="map-marker-check-outline" size={16} color={colors.info} />
                                    <Text style={[styles.vendorPickupNoteText, { color: colors.textSecondary }]}>
                                        {t('booking.details.showUpFinish', {
                                            showUp: formatQueueTime(booking.queue.show_up_at),
                                            finish: formatQueueTime(booking.queue.estimated_finish_at),
                                        })}
                                    </Text>
                                </View>
                            </GlassView>
                        </Animated.View>
                    ) : null}

                    {/* Timeline Tracking Steps Card */}
                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('booking.details.tracking')}</Text>
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
                                                <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : reached ? colors.textSecondary : colors.textMuted }]}>{t(`bookingStatus.${step.key.replace(/-/g, '_')}`)}</Text>
                                                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                                                    {reached ? (index === 0 ? formatDate(booking.booking_date) : active ? t('common.currentStep') : t('filter.completed')) : t('filter.pending')}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </GlassView>
                    </Animated.View>

                    {/* Service Provider Profile & Communications Grid Card */}
                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                {t('booking.details.provider')}
                            </Text>
                            <View style={styles.vendorCustomerRow}>
                                <View style={styles.vendorCustomerText}>
                                    <Text style={[styles.customerName, { color: colors.textPrimary }]}>
                                        {booking.provider_name || t('booking.details.providerUnavailable')}
                                    </Text>
                                    <Text style={[styles.customerHint, { color: colors.textSecondary }]}>
                                        {t('booking.details.provider')}
                                    </Text>
                                </View>
                                {booking.provider_phone ? (
                                    <View style={styles.iconGroup}>
                                        <Pressable style={[styles.iconBubble, { backgroundColor: colors.pink + '15' }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                                            <MaterialCommunityIcons name="phone-outline" size={20} color={colors.pink} />
                                        </Pressable>
                                        <Pressable style={[styles.iconBubble, { backgroundColor: colors.purple + '15' }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                                            <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.purple} />
                                        </Pressable>
                                    </View>
                                ) : null}
                            </View>
                            <View style={styles.vendorOpsGrid}>
                                <View style={[styles.vendorOpsTile, { backgroundColor: colors.pink + '10' }]}>
                                    <MaterialCommunityIcons name="calendar-check-outline" size={16} color={colors.pink} />
                                    <Text style={[styles.vendorOpsLabel, { color: colors.textMuted }]}>{t('common.date')}</Text>
                                    <Text style={[styles.vendorOpsValue, { color: colors.textPrimary }]}>{formatDate(booking.booking_date)}</Text>
                                </View>
                                <View style={[styles.vendorOpsTile, { backgroundColor: colors.purple + '10' }]}>
                                    <MaterialCommunityIcons name="clock-outline" size={16} color={colors.purple} />
                                    <Text style={[styles.vendorOpsLabel, { color: colors.textMuted }]}>{t('common.time')}</Text>
                                    <Text style={[styles.vendorOpsValue, { color: colors.textPrimary }]}>{booking.start_time || '-'}</Text>
                                </View>
                                {booking.service_duration ? (
                                    <View style={[styles.vendorOpsTile, { backgroundColor: colors.pink + '10' }]}>
                                        <MaterialCommunityIcons name="timer-outline" size={16} color={colors.pink} />
                                        <Text style={[styles.vendorOpsLabel, { color: colors.textMuted }]}>{t('booking.details.duration', { defaultValue: 'Duration' })}</Text>
                                        <Text style={[styles.vendorOpsValue, { color: colors.textPrimary }]}>{booking.service_duration} {minutesShort}</Text>
                                    </View>
                                ) : null}
                            </View>
                        </GlassView>
                    </Animated.View>

                    {/* Location and Schedule Address Card */}
                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>
                                    {t('booking.details.locationSchedule') || 'Location & Schedule'}
                                </Text>
                            </View>
                            <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
                                <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>
                                    {booking.address_title || t('booking.details.serviceAddress')}
                                </Text>
                                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                    {booking.street || booking.location || t('booking.details.noStreetAddress')}{booking.city ? `, ${booking.city}` : ''}
                                </Text>
                                {(booking.building || booking.apartment_floor) && (
                                    <Text style={[styles.addressSubtext, { color: colors.textSecondary }]}>
                                        {booking.building ? t('booking.details.building', { value: booking.building }) : ''}
                                        {booking.building && booking.apartment_floor ? ' | ' : ''}
                                        {booking.apartment_floor ? t('booking.details.aptFloor', { value: booking.apartment_floor }) : ''}
                                    </Text>
                                )}
                                {booking.notes && (
                                    <View style={[styles.notesContainer, { borderTopColor: colors.cardBorder }]}>
                                        <Text style={[styles.notesLabel, { color: colors.textMuted }]}>{t('booking.details.notes') || 'Notes'}</Text>
                                        <Text style={[styles.notesText, { color: colors.textSecondary }]}>{booking.notes}</Text>
                                    </View>
                                )}
                                {booking.latitude && booking.longitude ? (
                                    <View style={{ marginTop: Spacing.md }}>
                                        <GetDirectionsButton
                                            latitude={Number(booking.latitude)}
                                            longitude={Number(booking.longitude)}
                                            label={booking.street || booking.location || undefined}
                                        />
                                    </View>
                                ) : null}
                            </View>
                        </GlassView>
                    </Animated.View>

                    {/* Service Details Card (Formatted like Order Items with Summary totals box) */}
                    <Animated.View entering={FadeInDown.delay(500).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card} {...{} as any}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="car-cog" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('booking.details.service')}</Text>
                            </View>

                            <View style={{ marginTop: Spacing.md }}>
                                <View style={[styles.itemRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.itemName, { color: colors.textPrimary }]}>{serviceTitle}</Text>
                                        <View style={styles.qtyContainer}>
                                            <Text style={[styles.itemQty, { color: colors.textSecondary }]}>{booking.service_duration ? `${booking.service_duration} ${minutesShort}` : ''}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.itemPrice, { color: colors.pink }]}>{formatMoney(booking.booking_price, currencySuffix)}</Text>
                                </View>
                                {booking.service_description ? (
                                    <Text style={[styles.cardSub, { color: colors.textSecondary, marginTop: Spacing.xs }]}>{booking.service_description}</Text>
                                ) : null}
                            </View>

                            <View style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', marginTop: Spacing.md }]}>
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('booking.details.subtotal', { defaultValue: 'Subtotal' })}</Text>
                                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{formatMoney(booking.booking_price, currencySuffix)}</Text>
                                </View>
                                <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
                                <View style={styles.summaryRow}>
                                    <Text style={[styles.totalLabel, { color: colors.textPrimary }]}>{t('booking.details.totalAmount')}</Text>
                                    <Text style={[styles.totalValue, { color: colors.pink }]}>{formatMoney(booking.booking_price, currencySuffix)}</Text>
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <View style={styles.spacer} />
                </ScrollView>
            )}

            {/* Sticky Frosted Glass Absolute Footer Button Container */}
            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} style={styles.footerContainer} {...{} as any}>
                {booking && (
                    <View style={styles.customerActionsContainer}>
                        {booking.status?.toLowerCase() === 'completed' ? (
                            <View style={styles.stackedActions}>
                                {/* Primary Action: Rate or Reviewed badge */}
                                {!isReviewed ? (
                                    <GradientButton
                                        title={t('common.rate')}
                                        onPress={() => setReviewModalVisible(true)}
                                        style={{ width: '100%' }}
                                        icon="star-outline"
                                    />
                                ) : (
                                    <View style={[styles.reviewedBadge, { backgroundColor: colors.success + '20', width: '100%' }]}>
                                        <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />
                                        <Text style={[styles.reviewedText, { color: colors.success }]}>{t('booking.details.reviewed') || 'Reviewed'}</Text>
                                    </View>
                                )}

                                {/* Secondary Action: Support */}
                                <View style={styles.rowActions}>
                                    <GradientButton
                                        title={t('common.support')}
                                        onPress={() => router.push('/support' as any)}
                                        style={{ flex: 1 }}
                                        icon="chat-question-outline"
                                    />
                                </View>
                            </View>
                        ) : (
                            /* Non-completed bookings: standard row layout with Support + Cancel Booking (if pending/confirmed/in-progress) */
                            <View style={styles.rowActions}>
                                <GradientButton
                                    title={t('common.support')}
                                    onPress={() => router.push('/support' as any)}
                                    style={{ flex: 1 }}
                                    icon="chat-question-outline"
                                />
                                {canCancel(booking.status) ? (
                                    <OutlinedButton
                                        title={t('common.cancel')}
                                        onPress={handleCancel}
                                        disabled={updating}
                                        textColor={colors.error}
                                        borderColor={colors.error}
                                        style={{ flex: 1 }}
                                    />
                                ) : null}
                            </View>
                        )}
                    </View>
                )}
            </GlassView>

            {/* Review Modal */}
            {booking && (
                <ReviewModal
                    visible={reviewModalVisible}
                    onClose={() => setReviewModalVisible(false)}
                    entityId={booking.provider_id_fk || 0}
                    entityName={booking.provider_name || t('booking.details.provider')}
                    entityType="provider"
                    bookingId={booking.booking_id}
                    items={[{
                        id: booking.service_id_fk || 0,
                        name: booking.service_name,
                        type: 'service',
                        rating: 0,
                        comment: '',
                    }]}
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
    bookingId: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, letterSpacing: 0.5 },
    bookingDate: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 4, opacity: 0.7 },
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

    cardSub: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: 8, lineHeight: 20 },

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
    customerActionsContainer: {
        width: '100%',
    },
    stackedActions: {
        gap: Spacing.sm,
        width: '100%',
    },
    rowActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        alignItems: 'center',
        width: '100%',
    },
    reviewedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 56,
        borderRadius: BorderRadius.full,
    },
    reviewedText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
});
