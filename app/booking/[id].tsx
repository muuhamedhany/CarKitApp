import { useCallback, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CenteredHeader, GradientButton, OutlinedButton } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService, type Booking } from '@/services/api/booking.service';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

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
    const { colors } = useTheme();
    const { showToast } = useToast();
    const [booking, setBooking] = useState<NonNullable<BookingDetail> | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

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

    useFocusEffect(
        useCallback(() => {
            loadBooking();
        }, [loadBooking])
    );

    const timelineSteps = useMemo(
        () => [
            { key: 'pending', label: 'Booking Placed' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <View style={styles.cardHeader}>
                            <View>
                                <Text style={[styles.bookingId, { color: colors.textPrimary }]}>Booking #{booking.booking_id}</Text>
                                <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>{formatDate(booking.booking_date)}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: colors.pinkGlow }]}>
                                <Text style={[styles.statusText, { color: colors.pink }]}>{booking.status}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tracking</Text>
                        {timelineSteps.map((step, index) => {
                            const reached = currentPosition >= index;
                            const active = currentPosition === index;
                            return (
                                <View key={step.key} style={styles.timelineRow}>
                                    <View style={styles.timelineRailCol}>
                                        <View style={[styles.timelineDot, { backgroundColor: reached ? colors.pink : colors.border, borderColor: reached ? colors.pink : colors.border }]}>
                                            {reached ? <MaterialCommunityIcons name="check" size={12} color={colors.white} /> : null}
                                        </View>
                                        {index < timelineSteps.length - 1 ? (
                                            <View style={[styles.timelineLine, { backgroundColor: reached ? colors.pink : colors.border }]} />
                                        ) : null}
                                    </View>
                                    <View style={styles.timelineLabelCol}>
                                        <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : colors.textSecondary }]}>{step.label}</Text>
                                        <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{reached ? formatDate(booking.booking_date) : 'Pending'}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service</Text>
                        <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{serviceTitle}</Text>
                        {booking.service_description ? (
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{booking.service_description}</Text>
                        ) : null}
                        {booking.service_duration ? (
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{booking.service_duration} min</Text>
                        ) : null}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Provider</Text>
                        <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{booking.provider_name || 'Provider details unavailable'}</Text>
                        {booking.provider_phone ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.provider_phone}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Schedule</Text>
                        <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(booking.booking_date)}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.start_time}</Text>
                        </View>
                        {booking.location || booking.address_title ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.location || booking.address_title || 'No location selected'}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Address</Text>
                        <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{booking.street || booking.location || 'No street address'}</Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                            {[booking.address_title, booking.city].filter(Boolean).join(' • ') || 'No additional address details'}
                        </Text>
                    </View>

                    <View style={[styles.priceCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Total Amount</Text>
                        <Text style={[styles.priceValue, { color: colors.pink }]}>{formatMoney(booking.booking_price)}</Text>
                    </View>

                    <View style={styles.actionsRow}>
                        <GradientButton title="Support" onPress={() => router.push('/support' as any)} style={{ flex: 1 }} />
                        {canCancel(booking.status) ? (
                            <OutlinedButton title="Cancel" onPress={handleCancel} style={{ flex: 1 }} />
                        ) : null}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
    card: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    bookingId: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
    bookingDate: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 4 },
    statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full },
    statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
    timelineRow: { flexDirection: 'row', gap: Spacing.sm },
    timelineRailCol: { alignItems: 'center' },
    timelineDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineLine: { width: 2, flex: 1, marginVertical: 4, borderRadius: 999 },
    timelineLabelCol: { flex: 1, paddingBottom: Spacing.md },
    timelineLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    timelineDate: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
    cardValue: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 4 },
    cardSub: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    metaText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    priceCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceValue: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
    actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
});