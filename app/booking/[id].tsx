import { useCallback, useMemo, useState } from 'react';
import { 
  Alert, 
  ActivityIndicator, 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  Dimensions,
  Pressable 
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { CenteredHeader, GradientButton, OutlinedButton, GetDirectionsButton, GlassView} from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { bookingService, type Booking } from '@/services/api/booking.service';
import { reviewService } from '@/services/api/review.service';
import { ReviewModal } from '@/components/ReviewModal';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

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

const formatTime = (value?: string | null) => {
    if (!value) return '-';
    try {
        const [hours, minutes] = value.split(':').map((part) => Number(part));
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
        return value;
    }
};

const formatMoney = (value: string | number) => `${Number(value || 0).toLocaleString('en-EG')} EGP`;

const canCancel = (status?: string | null) => {
    const normalized = String(status || '').toLowerCase();
    return normalized === 'pending' || normalized === 'confirmed' || normalized === 'in-progress';
};

export default function BookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();
    const [booking, setBooking] = useState<NonNullable<BookingDetail> | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [isReviewed, setIsReviewed] = useState(false);

    const bookingId = Number(id || 0);

    const loadBooking = useCallback(async () => {
        if (!bookingId) {
            showToast('error', 'Invalid Booking', 'Booking id is missing.');
            router.back();
            return;
        }

        try {
            setLoading(true);
            const response = await bookingService.getBookingById(bookingId);
            if (!response.success || !response.data) {
                showToast('error', 'Booking Error', response.message || 'Unable to load booking details.');
                return;
            }
            setBooking(response.data as NonNullable<BookingDetail>);
        } catch {
            showToast('error', 'Booking Error', 'Unable to load booking details.');
        } finally {
            setLoading(false);
        }
    }, [bookingId, router, showToast]);

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
            { key: 'pending', label: 'Booking Placed', icon: 'calendar-check' },
            { key: 'confirmed', label: 'Confirmed', icon: 'check-circle-outline' },
            { key: 'in-progress', label: 'In Progress', icon: 'clock-outline' },
            { key: 'completed', label: 'Completed', icon: 'flag-checkered' },
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

        Alert.alert('Cancel Booking', 'Do you want to cancel this booking?', [
            { text: 'Keep Booking', style: 'cancel' },
            {
                text: 'Cancel Booking',
                style: 'destructive',
                onPress: async () => {
                    try {
                        setUpdating(true);
                        const response = await bookingService.cancelBooking(booking.booking_id);
                        if (!response.success) {
                            showToast('error', 'Cancel Failed', response.message || 'Could not cancel booking.');
                            return;
                        }
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        showToast('success', 'Booking Cancelled', 'Your booking was cancelled successfully.');
                        await loadBooking();
                    } catch {
                        showToast('error', 'Cancel Failed', 'Could not cancel booking.');
                    } finally {
                        setUpdating(false);
                    }
                },
            },
        ]);
    };

    const serviceTitle = booking?.service_name || 'Service';

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
              colors={[isDark ? '#0F172A' : '#F8FAFC', isDark ? '#020617' : '#F1F5F9']}
              style={StyleSheet.absoluteFill}
            />
            
            <Animated.View entering={FadeInDown.duration(1000)} style={[styles.orb, styles.orb1, { backgroundColor: colors.pink }]} />
            <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={[styles.orb, styles.orb2, { backgroundColor: colors.purple }]} />

            <CenteredHeader title="Booking Details" titleColor={colors.textPrimary} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : !booking ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Booking not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <Animated.View entering={FadeInDown.delay(100).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={[styles.bookingId, { color: colors.textPrimary }]}>Booking #{booking.booking_id}</Text>
                                    <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>{formatDate(booking.booking_date)}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: colors.pink + '20' }]}>
                                    <Text style={[styles.statusText, { color: colors.pink }]}>{booking.status}</Text>
                                </View>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tracking</Text>
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
                                                <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : reached ? colors.textSecondary : colors.textMuted }]}>{step.label}</Text>
                                                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                                                    {reached ? (index === 0 ? formatDate(booking.booking_date) : 'Completed') : 'Pending'}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(300).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="car-cog" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Service</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{serviceTitle}</Text>
                            {booking.service_description ? (
                                <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{booking.service_description}</Text>
                            ) : null}
                            {booking.service_duration ? (
                                <View style={styles.metaRow}>
                                    <MaterialCommunityIcons name="timer-outline" size={14} color={colors.textMuted} />
                                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.service_duration} min</Text>
                                </View>
                            ) : null}
                        </GlassView>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(400).springify()}>
                        <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.card}>
                            <View style={styles.sectionHeader}>
                                <MaterialCommunityIcons name="account-tie" size={20} color={colors.pink} />
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Provider</Text>
                            </View>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{booking.provider_name || 'Provider details unavailable'}</Text>
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
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Location & Schedule</Text>
                            </View>
                            <View style={styles.scheduleRow}>
                                <View style={styles.scheduleItem}>
                                    <Text style={styles.scheduleLabel}>Date</Text>
                                    <Text style={[styles.scheduleValue, { color: colors.textPrimary }]}>{formatDate(booking.booking_date)}</Text>
                                </View>
                                <View style={styles.scheduleDivider} />
                                <View style={styles.scheduleItem}>
                                    <Text style={styles.scheduleLabel}>Time</Text>
                                    <Text style={[styles.scheduleValue, { color: colors.textPrimary }]}>{booking.start_time}</Text>
                                </View>
                            </View>
                            
                            <View style={styles.addressContainer}>
                                <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>{booking.address_title || 'Service Address'}</Text>
                                <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                                    {booking.street || booking.location || 'No street address'}{booking.city ? `, ${booking.city}` : ''}
                                </Text>
                                {(booking.building || booking.apartment_floor) && (
                                    <Text style={[styles.addressSubtext, { color: colors.textSecondary }]}>
                                        {booking.building ? `Building: ${booking.building}` : ''}
                                        {booking.building && booking.apartment_floor ? ' | ' : ''}
                                        {booking.apartment_floor ? `Apt/Floor: ${booking.apartment_floor}` : ''}
                                    </Text>
                                )}
                            </View>

                            {booking.notes && (
                                <View style={[styles.notesContainer, { borderTopColor: colors.cardBorder }]}>
                                    <Text style={[styles.notesLabel, { color: colors.textMuted }]}>Notes:</Text>
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
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={[styles.priceValue, { color: colors.pink }]}>{formatMoney(booking.booking_price)}</Text>
                            </View>
                            <View style={styles.paymentBadge}>
                                <MaterialCommunityIcons name="credit-card-check" size={16} color={colors.white} />
                                <Text style={styles.paymentText}>Paid</Text>
                            </View>
                        </GlassView>
                    </Animated.View>

                    <View style={styles.actionsRow}>
                        <GradientButton 
                            title="Contact Support" 
                            onPress={() => router.push('/support' as any)} 
                            style={{ flex: 1 }} 
                            icon="chat-processing-outline"
                        />
                        {canCancel(booking.status) ? (
                            <OutlinedButton 
                                title="Cancel" 
                                onPress={handleCancel} 
                                style={{ flex: 1 }} 
                                textColor={colors.error}
                                borderColor={colors.error}
                            />
                        ) : null}
                        {booking.status?.toLowerCase() === 'completed' && !isReviewed ? (
                            <GradientButton 
                                title="Rate Service" 
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
                </ScrollView>
            )}

            {booking && (
                <ReviewModal
                    visible={reviewModalVisible}
                    onClose={() => setReviewModalVisible(false)}
                    entityId={booking.provider_id_fk || 0}
                    entityName={booking.provider_name || 'Provider'}
                    entityType="provider"
                    bookingId={booking.booking_id}
                    items={[{
                        id: booking.service_id_fk,
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
        width: width * 0.7,
        height: width * 0.7,
        borderRadius: (width * 0.7) / 2,
        opacity: 0.12,
    },
    orb1: { top: -width * 0.2, right: -width * 0.1 },
    orb2: { bottom: height * 0.2, left: -width * 0.3 },

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