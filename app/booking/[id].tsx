import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import {
    ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CenteredHeader, GetDirectionsButton, GlassView, GradientButton, OutlinedButton } from '@/components';
import Text from '@/components/common/LocalizedText';
import { ReviewModal } from '@/components/ReviewModal';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { bookingService, type Booking } from '@/services/api/booking.service';
import { reviewService } from '@/services/api/review.service';

type BookingDetail = Booking;

const formatDate = (value?: string | null) => {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
        });
    } catch {
        return value;
    }
};

const formatMoney = (value: string | number, currency: string) => `${Number(value || 0).toLocaleString('en-EG')} ${currency}`;

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

const canCancel = (status?: string | null) => {
    const normalized = String(status || '').toLowerCase();
    return normalized === 'pending' || normalized === 'confirmed' || normalized === 'in-progress';
};

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const currencySuffix = t('common.currency.egp');
    const minutesShort = t('common.minutesShort');
    const hoursShort = t('common.hoursShort');
    const minutesCompact = t('common.minutesCompact');
    const [booking, setBooking] = useState<NonNullable<BookingDetail> | null>(null);
    const [loading, setLoading] = useState(true);
    const [, setUpdating] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [isReviewed, setIsReviewed] = useState(false);

    const bookingId = Number(id || 0);

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

    const timelineSteps = useMemo(
        () => [
            { key: 'pending', icon: 'calendar-check' },
            { key: 'confirmed', icon: 'check-circle-outline' },
            { key: 'in-progress', icon: 'clock-outline' },
            { key: 'completed', icon: 'flag-checkered' },
        ],
        []
    );

    const currentPosition = useMemo(() => {
        const normalized = String(booking?.status || '').toLowerCase();
        const index = timelineSteps.findIndex((step) => step.key === normalized);
        return index >= 0 ? index : 0;
    }, [booking?.status, timelineSteps]);

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

    const serviceTitle = booking?.service_name || t('booking.details.service');

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : !booking ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('booking.details.notFound')}</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <CenteredHeader title={t('booking.details.title')} titleColor={colors.textPrimary} />
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.bookingId, { color: colors.textPrimary }]}>{t('booking.details.bookingNumber', { id: booking.booking_id })}</Text>
                                    <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>{formatDate(booking.booking_date)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: colors.pink + '20' }]}>
                                    <Text style={[styles.statusText, { color: colors.pink }]}>{t(`status.${String(booking.status || '').toLowerCase().replace(/-/g, '_')}`, { defaultValue: String(booking.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })}</Text>
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
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
                                                        borderColor: reached ? colors.pink : colors.cardBorder
                                                    }
                                                ]}>
                                                    <MaterialCommunityIcons
                                                        name={step.icon as any}
                                                        size={12}
                                                        color={reached ? colors.white : colors.textMuted}
                                                    />
                                                </View>
                                                {index < timelineSteps.length - 1 ? (
                                                    <View style={[styles.timelineLine, { backgroundColor: reached ? colors.pink : colors.cardBorder, opacity: reached ? 1 : 0.3 }]} />
                                                ) : null}
                                            </View>
                                            <View style={styles.timelineLabelCol}>
                                                <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : reached ? colors.textSecondary : colors.textMuted }]}>{t(`bookingStatus.${step.key.replace(/-/g, '_')}`)}</Text>
                                                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                                                    {reached ? (index === 0 ? formatDate(booking.booking_date) : t('filter.completed')) : t('filter.pending')}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </GlassView>
                    </Animated.View>

                    {booking.queue ? (
                        <Animated.View entering={FadeInDown.delay(250).springify()}>
                            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                                <View style={styles.sectionHeader}>
                                    <MaterialCommunityIcons name="account-clock-outline" size={20} color={colors.pink} />
                                    <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('booking.details.serviceQueue')}</Text>
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
                                <View style={[styles.queueNote, { backgroundColor: colors.infoSoft }]}>
                                    <MaterialCommunityIcons name="map-marker-check-outline" size={16} color={colors.info} />
                                    <Text style={[styles.queueNoteText, { color: colors.textSecondary }]}>
                                        {t('booking.details.showUpFinish', {
                                            showUp: formatQueueTime(booking.queue.show_up_at),
                                            finish: formatQueueTime(booking.queue.estimated_finish_at),
                                        })}
                                    </Text>
                                </View>
                            </GlassView>
                        </Animated.View>
                    ) : null}

                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="car-cog" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('booking.details.service')}</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{serviceTitle}</Text>
                            {booking.service_description ? (
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{booking.service_description}</Text>
                            ) : null}
                            {booking.service_duration ? (
                                <View style={styles.metaRow}>
                                    <MaterialCommunityIcons name="timer-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.service_duration} {minutesShort}</Text>
                                </View>
                            ) : null}
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="account-tie" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('booking.details.provider')}</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{booking.provider_name || t('booking.details.providerUnavailable')}</Text>
                            {booking.provider_phone ? (
                                <View style={styles.metaRow}>
                                    <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.provider_phone}</Text>
                                </View>
                            ) : null}
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(500).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('booking.details.locationSchedule')}</Text>
                            </View>
                            <View style={styles.scheduleRow}>
                                <View style={styles.scheduleItem}>
                                    <Text style={styles.scheduleLabel}>{t('common.date')}</Text>
                                    <Text style={[styles.scheduleValue, { color: colors.textPrimary }]}>{formatDate(booking.booking_date)}</Text>
                                </View>
                                <View style={styles.scheduleDivider} />
                                <View style={styles.scheduleItem}>
                                    <Text style={styles.scheduleLabel}>{t('common.time')}</Text>
                                    <Text style={[styles.scheduleValue, { color: colors.textPrimary }]}>{booking.start_time}</Text>
                                </View>
                            </View>

                            <View style={styles.addressContainer}>
                                <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>{booking.address_title || t('booking.details.serviceAddress')}</Text>
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
                            </View>

                            {booking.notes && (
                                <View style={[styles.notesContainer, { borderTopColor: colors.cardBorder }]}>
                                    <Text style={[styles.notesLabel, { color: colors.textMuted }]}>{t('booking.details.notes')}</Text>
                                    <Text style={[styles.notesText, { color: colors.textSecondary }]}>{booking.notes}</Text>
                                </View>
                            )}

                            {booking.latitude && booking.longitude ? (
                                <View style={{ marginTop: Spacing.md }}>
                                    <GetDirectionsButton
                                        latitude={booking.latitude}
                                        longitude={booking.longitude}
                                        label={booking.street || booking.location || undefined}
                                    />
                                </View>
                            ) : null}
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(600).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.priceCard}>
                            <View>
                                <Text style={styles.totalLabel}>{t('booking.details.totalAmount')}</Text>
                                <Text style={[styles.priceValue, { color: colors.pink }]}>{formatMoney(booking.booking_price, currencySuffix)}</Text>
                            </View>
                            <View style={styles.paymentBadge}>
                                <MaterialCommunityIcons name="credit-card-check" size={16} color={colors.white} />
                                <Text style={styles.paymentText}>{t('common.paid')}</Text>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <View style={styles.actionsRow}>
                        <GradientButton
                            title={t('common.support')}
                            onPress={() => router.push('/support' as any)}
                            style={{ flex: 1 }}
                            icon="chat-processing-outline"
                        />
                        {canCancel(booking.status) ? (
                            <OutlinedButton
                                title={t('common.cancel')}
                                onPress={handleCancel}
                                style={{ flex: 1 }}
                                textColor={colors.error}
                                borderColor={colors.error}
                            />
                        ) : null}
                        {booking.status?.toLowerCase() === 'completed' && !isReviewed ? (
                            <GradientButton
                                title={t('common.rate')}
                                onPress={() => setReviewModalVisible(true)}
                                style={{ flex: 1 }}
                                icon="star-outline"
                            />
                        ) : isReviewed ? (
                            <View style={[styles.reviewedBadge, { backgroundColor: colors.success + '20' }]}>
                                <MaterialCommunityIcons name="check-decagram" size={16} color={colors.success} />
                                <Text style={[styles.reviewedText, { color: colors.success }]}>{t('booking.details.reviewed')}</Text>
                            </View>
                        ) : null}
                    </View>
                </ScrollView>
            )}

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
    content: { paddingHorizontal: Spacing.md, paddingBottom: 120, paddingTop: Spacing.sm },

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
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    bookingId: { fontFamily: Fonts.bold, fontSize: FontSizes.md, letterSpacing: 0.5 },
    bookingDate: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 4, opacity: 0.7 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
    statusText: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
    sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, letterSpacing: 0.5 },

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

    cardValue: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 6 },
    cardSub: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: 8, lineHeight: 20 },

    scheduleRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        alignItems: 'center',
    },
    scheduleItem: { flex: 1, alignItems: 'center' },
    scheduleDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.1)' },
    scheduleLabel: { fontFamily: Fonts.medium, fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 },
    scheduleValue: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

    addressContainer: { gap: 4 },
    addressTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
    addressText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, opacity: 0.8 },
    addressSubtext: { fontFamily: Fonts.medium, fontSize: 11, opacity: 0.6 },

    notesContainer: {
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
    },
    notesLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    notesText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, lineHeight: 20, opacity: 0.8 },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, opacity: 0.8 },
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
    queueNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, borderRadius: BorderRadius.md },
    queueNoteText: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.xs },

    priceCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow: 'hidden',
    },
    totalLabel: { fontFamily: Fonts.medium, fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
    priceValue: { fontFamily: Fonts.bold, fontSize: FontSizes.xxl, marginTop: 2 },
    paymentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#10B981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full
    },
    paymentText: { fontFamily: Fonts.bold, fontSize: 10, color: '#FFF', textTransform: 'uppercase' },

    actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, alignItems: 'center' },
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
