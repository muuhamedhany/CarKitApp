import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, GradientButton, OutlinedButton } from '@/components';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { ProviderBookingDetail } from '@/types/api.types';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

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

const getStatusTint = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'completed') return { bg: 'rgba(16,185,129,0.18)', fg: '#10B981' };
    if (normalized === 'confirmed') return { bg: 'rgba(129,140,248,0.18)', fg: '#818CF8' };
    if (normalized === 'cancelled') return { bg: 'rgba(239,68,68,0.18)', fg: '#EF4444' };
    if (normalized === 'in-progress') return { bg: 'rgba(205,66,168,0.18)', fg: '#CD42A8' };
    return { bg: 'rgba(255,183,77,0.18)', fg: '#FFB74D' };
};

const canMoveForward = (status: string) => {
    const normalized = (status || '').toLowerCase();
    if (normalized === 'pending') return { label: 'Confirm Booking', next: 'confirmed' };
    if (normalized === 'confirmed') return { label: 'Mark In Progress', next: 'in-progress' };
    if (normalized === 'in-progress') return { label: 'Mark Completed', next: 'completed' };
    return null;
};

const canCancel = (status: string) => {
    const normalized = (status || '').toLowerCase();
    return normalized === 'pending' || normalized === 'confirmed' || normalized === 'in-progress';
};

export default function ProviderBookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [booking, setBooking] = useState<ProviderBookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const bookingId = Number(id || 0);

    const loadBooking = useCallback(async () => {
        if (!bookingId) {
            showToast('error', 'Error', 'Booking id is missing.');
            router.back();
            return;
        }

        try {
            setLoading(true);
            const response = await providerService.getBookingById(bookingId);
            if (response.success && response.data) {
                setBooking(response.data);
            } else {
                showToast('error', 'Error', response.message || 'Failed to load booking.');
            }
        } catch {
            showToast('error', 'Error', 'Failed to load booking.');
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
            { key: 'pending', label: 'Placed' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
        ],
        []
    );

    const currentStep = useMemo(() => {
        const index = timelineSteps.findIndex((step) => step.key === (booking?.status || '').toLowerCase());
        return index >= 0 ? index : 0;
    }, [booking?.status, timelineSteps]);

    const updateStatus = async (status: string) => {
        if (!booking) return;
        try {
            setUpdating(true);
            const response = await providerService.updateBookingStatus(booking.booking_id, status);
            if (!response.success) {
                showToast('error', 'Update Failed', response.message || 'Could not update booking status.');
                return;
            }
            setBooking((current) => (current ? { ...current, status } : current));
            showToast('success', 'Booking Updated', `Booking marked as ${status}.`);
        } catch {
            showToast('error', 'Update Failed', 'Could not update booking status.');
        } finally {
            setUpdating(false);
        }
    };

    const requestCancel = () => {
        if (!booking) return;
        Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
            { text: 'Keep Booking', style: 'cancel' },
            { text: 'Cancel Booking', style: 'destructive', onPress: () => updateStatus('cancelled') },
        ]);
    };

    const statusAction = booking ? canMoveForward(booking.status) : null;
    const tint = booking ? getStatusTint(booking.status) : getStatusTint('pending');

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <CenteredHeader title="Booking Details" titleColor={colors.textPrimary} />

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : !booking ? (
                <View style={styles.centered}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Booking not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={[styles.heroCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <View style={styles.heroHeader}>
                            <View>
                                <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>#{booking.booking_id}</Text>
                                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{booking.service_name}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: tint.bg }]}>
                                <Text style={[styles.statusText, { color: tint.fg }]}>{booking.status}</Text>
                            </View>
                        </View>
                        <View style={styles.heroMetaRow}>
                            <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.heroMetaText, { color: colors.textSecondary }]}>{formatDate(booking.booking_date)}</Text>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
                            <Text style={[styles.heroMetaText, { color: colors.textSecondary }]}>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</Text>
                        </View>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Progress</Text>
                        {timelineSteps.map((step, index) => {
                            const reached = currentStep >= index;
                            const active = currentStep === index;
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
                                    <View style={styles.timelineTextCol}>
                                        <Text style={[styles.timelineLabel, { color: active ? colors.textPrimary : colors.textSecondary }]}>{step.label}</Text>
                                        <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{reached ? formatDate(booking.booking_date) : 'Pending'}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Customer</Text>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{booking.customer_name}</Text>
                        {booking.customer_phone ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.customer_phone}</Text>
                            </View>
                        ) : null}
                        {booking.customer_email ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="email-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.customer_email}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Service</Text>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{booking.service_name}</Text>
                        {booking.service_description ? (
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{booking.service_description}</Text>
                        ) : null}
                        {booking.service_duration ? (
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{booking.service_duration} min</Text>
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
                            <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</Text>
                        </View>
                        {booking.location ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.location}</Text>
                            </View>
                        ) : null}
                        {booking.address_title ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="home-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{booking.address_title}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Address</Text>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{booking.street || 'No street address'}</Text>
                        <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                            {[booking.building, booking.apartment, booking.city].filter(Boolean).join(' • ') || 'No additional address details'}
                        </Text>
                    </View>

                    <View style={[styles.priceCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: 0 }]}>Total Amount</Text>
                        <Text style={[styles.priceValue, { color: colors.pink }]}>{formatMoney(booking.booking_price)}</Text>
                    </View>

                    {booking.notes ? (
                        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notes</Text>
                            <Text style={[styles.cardSub, { color: colors.textSecondary }]}>{booking.notes}</Text>
                        </View>
                    ) : null}

                    <View style={styles.actionsRow}>
                        {statusAction ? (
                            <GradientButton
                                title={statusAction.label}
                                onPress={() => updateStatus(statusAction.next)}
                                style={{ flex: 1 }}
                            />
                        ) : null}
                        {canCancel(booking.status) ? (
                            <OutlinedButton
                                title="Cancel"
                                onPress={requestCancel}
                                style={{ flex: 1 }}
                            />
                        ) : null}
                    </View>

                    <View style={styles.supportRow}>
                        <OutlinedButton
                            title="Support"
                            onPress={() => router.push('/support' as any)}
                            style={{ flex: 1 }}
                        />
                    </View>

                    {updating ? <ActivityIndicator color={colors.pink} style={{ marginTop: Spacing.md }} /> : null}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    content: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
    heroCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heroTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
    heroSubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
    heroMetaText: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
    statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full },
    statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    card: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
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
    timelineTextCol: { flex: 1, paddingBottom: Spacing.md },
    timelineLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    timelineDate: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginTop: 2 },
    cardTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 4 },
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
    supportRow: { marginBottom: Spacing.md },
});
