import { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { ProviderBookingDetail } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { GradientButton, OutlinedButton } from '@/components';
import { useFocusEffect } from 'expo-router';

function getStatusTint(status: string) {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return { bg: 'rgba(16,185,129,0.15)', fg: '#10B981' };
    if (s === 'confirmed') return { bg: 'rgba(129,140,248,0.15)', fg: '#818CF8' };
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' };
    return { bg: 'rgba(205,66,168,0.15)', fg: '#CD42A8' };
}

export default function ProviderBookingDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [booking, setBooking] = useState<ProviderBookingDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const loadBooking = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await providerService.getBookingById(Number(id));
            if (res.success && res.data) setBooking(res.data);
        } catch (err: any) {
            showToast('error', 'Error', err?.message || 'Failed to load booking.');
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useFocusEffect(useCallback(() => { loadBooking(); }, [loadBooking]));

    const handleStatusChange = async (status: string) => {
        if (!booking) return;
        setUpdating(true);
        try {
            const res = await providerService.updateBookingStatus(booking.booking_id, status);
            if (res.success) {
                setBooking(prev => prev ? { ...prev, status } : prev);
                showToast('success', 'Updated', `Booking marked as ${status}.`);
            }
        } catch {
            showToast('error', 'Error', 'Could not update booking status.');
        } finally {
            setUpdating(false);
        }
    };

    const tint = booking ? getStatusTint(booking.status) : { bg: '', fg: '' };
    const bookingDate = booking?.booking_date?.slice(0, 10) || '';
    const time = booking?.start_time?.slice(0, 5) || '';

    const status = booking?.status?.toLowerCase();
    const isPending = status === 'pending';
    const isConfirmed = status === 'confirmed';
    const isInProgress = status === 'in-progress';
    const isCancellable = isPending || isConfirmed || isInProgress;

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Booking Details</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : !booking ? (
                <View style={styles.centered}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Booking not found.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Status badge */}
                    <View style={styles.statusRow}>
                        <View style={[styles.badge, { backgroundColor: tint.bg }]}>
                            <Text style={[styles.badgeText, { color: tint.fg }]}>{booking.status}</Text>
                        </View>
                        <Text style={[styles.bookingId, { color: colors.textMuted }]}>#{booking.booking_id}</Text>
                    </View>

                    {/* Service info */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Service</Text>
                        <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{booking.service_name}</Text>
                        {booking.service_description ? (
                            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{booking.service_description}</Text>
                        ) : null}
                        {booking.service_duration ? (
                            <Text style={[styles.cardSub, { color: colors.textMuted }]}>{booking.service_duration} min</Text>
                        ) : null}
                    </View>

                    {/* Customer info */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Customer</Text>
                        <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{booking.customer_name}</Text>
                        {booking.customer_phone ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textMuted }]}>{booking.customer_phone}</Text>
                            </View>
                        ) : null}
                        {booking.vehicle_year || booking.model_name ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="car-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textMuted }]}>
                                    {[booking.vehicle_year, booking.make_name, booking.model_name].filter(Boolean).join(' ')}
                                </Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Time info */}
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Date & Time</Text>
                        <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textPrimary }]}>{bookingDate}</Text>
                        </View>
                        <View style={styles.metaRow}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
                            <Text style={[styles.metaText, { color: colors.textPrimary }]}>{time}</Text>
                        </View>
                        {booking.location ? (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
                                <Text style={[styles.metaText, { color: colors.textMuted }]}>{booking.location}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Price */}
                    <View style={[styles.priceRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Total Amount</Text>
                        <Text style={[styles.priceValue, { color: colors.pink }]}>
                            {Number(booking.booking_price).toLocaleString('en-EG')} EGP
                        </Text>
                    </View>

                    {/* Actions */}
                    {updating && <ActivityIndicator color={colors.pink} style={{ marginVertical: Spacing.md }} />}
                    {!updating && (
                        <View style={styles.actions}>
                            {isPending && (
                                <GradientButton
                                    title="Confirm Booking"
                                    onPress={() => handleStatusChange('confirmed')}
                                    style={{ flex: 1 }}
                                />
                            )}
                            {isConfirmed && (
                                <GradientButton
                                    title="Mark In Progress"
                                    onPress={() => handleStatusChange('in-progress')}
                                    style={{ flex: 1 }}
                                />
                            )}
                            {isInProgress && (
                                <GradientButton
                                    title="Mark as Completed"
                                    onPress={() => handleStatusChange('completed')}
                                    style={{ flex: 1 }}
                                />
                            )}
                            {isCancellable && (
                                <OutlinedButton
                                    title="Cancel"
                                    onPress={() => handleStatusChange('cancelled')}
                                    style={{ flex: 1 }}
                                />
                            )}
                        </View>
                    )}

                    {booking.notes ? (
                        <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>Notes</Text>
                            <Text style={[styles.cardSub, { color: colors.textPrimary }]}>{booking.notes}</Text>
                        </View>
                    ) : null}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    },
    headerTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 120 },
    statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
    badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.full },
    badgeText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm, textTransform: 'capitalize' },
    bookingId: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
    card: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
    cardTitle: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
    cardValue: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 4 },
    cardSub: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    metaText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    priceRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md,
    },
    priceLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.md },
    priceValue: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
    actions: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    notesCard: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md },
});
