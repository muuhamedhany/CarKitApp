import { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, SectionList, Pressable, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { ProviderBooking } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { GradientButton, OutlinedButton } from '@/components';

type ViewMode = 'Month' | 'Week' | 'Day';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function getStatusTint(status: string, colors: any) {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return { bg: 'rgba(16,185,129,0.15)', fg: '#10B981' };
    if (s === 'confirmed') return { bg: 'rgba(129,140,248,0.15)', fg: '#818CF8' };
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' };
    return { bg: 'rgba(205,66,168,0.15)', fg: '#CD42A8' };
}

function getWeekDays(date: Date) {
    const day = date.getDay(); // 0=Sun
    const start = new Date(date);
    start.setDate(date.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function formatLongDate(date: Date) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function BookingCard({ item, colors, router, onConfirm }: {
    item: ProviderBooking; colors: any; router: any;
    onConfirm: (id: number) => void;
}) {
    const tint = getStatusTint(item.status, colors);
    const isPending = item.status?.toLowerCase() === 'pending';
    const bookingDate = item.booking_date?.slice(0, 10) || '';
    const time = item.start_time?.slice(0, 5) || '';

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardService, { color: colors.textPrimary }]}>{item.service_name}</Text>
                    <Text style={[styles.cardCustomer, { color: colors.textMuted }]}>{item.customer_name}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.badgeText, { color: tint.fg }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{bookingDate}</Text>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
                <Text style={[styles.metaText, { color: colors.textMuted }]}>{time}</Text>
            </View>

            <View style={styles.cardActions}>
                {isPending && (
                    <OutlinedButton
                        title="Confirm"
                        onPress={() => onConfirm(item.booking_id)}
                        style={{ flex: 1 }}
                    />
                )}
                <GradientButton
                    title="View Details"
                    onPress={() => router.push(`/provider-booking/${item.booking_id}`)}
                    style={{ flex: 1 }}
                />
            </View>
        </View>
    );
}

export default function BookingsScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showToast } = useToast();

    const [bookings, setBookings] = useState<ProviderBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('Week');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await providerService.getBookings('all');
            if (res.success && res.data) setBookings(res.data);
        } catch (err: any) {
            showToast('error', 'Error', err?.message || 'Failed to load bookings.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useFocusEffect(useCallback(() => { load(); }, [load]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    }, [load]);

    const handleConfirm = async (id: number) => {
        try {
            const res = await providerService.updateBookingStatus(id, 'confirmed');
            if (res.success) {
                setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, status: 'confirmed' } : b));
                showToast('success', 'Confirmed', 'Booking confirmed.');
            }
        } catch {
            showToast('error', 'Error', 'Could not confirm booking.');
        }
    };

    // Navigate month
    const goMonth = (dir: -1 | 1) => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + dir);
        setSelectedDate(d);
    };

    const weekDays = getWeekDays(selectedDate);

    // Filter bookings for selected day
    const dayBookings = bookings.filter(b => {
        if (!b.booking_date) return false;
        const bDate = new Date(b.booking_date);
        return isSameDay(bDate, selectedDate);
    });

    const modes: ViewMode[] = ['Month', 'Week', 'Day'];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Bookings</Text>
                <Pressable onPress={() => setSelectedDate(new Date())}>
                    <Text style={[styles.todayBtn, { color: colors.pink }]}>Today</Text>
                </Pressable>
            </View>

            {/* View mode selector */}
            <View style={[styles.modeBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {modes.map(m => (
                    <Pressable
                        key={m}
                        onPress={() => setViewMode(m)}
                        style={[
                            styles.modeBtn,
                            viewMode === m && { backgroundColor: colors.purpleDark },
                        ]}
                    >
                        <Text style={[
                            styles.modeBtnText,
                            { color: viewMode === m ? '#fff' : colors.textMuted },
                        ]}>{m}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Month nav */}
            <View style={styles.monthNav}>
                <Pressable onPress={() => goMonth(-1)}>
                    <MaterialCommunityIcons name="chevron-left" size={24} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.monthLabel, { color: colors.textPrimary }]}>
                    {MONTHS[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </Text>
                <Pressable onPress={() => goMonth(1)}>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textPrimary} />
                </Pressable>
            </View>

            {/* Week days */}
            <View style={styles.weekRow}>
                {DAYS.map(d => (
                    <Text key={d} style={[styles.dayLabel, { color: colors.textMuted }]}>{d}</Text>
                ))}
            </View>
            <View style={styles.weekDates}>
                {weekDays.map((d, i) => {
                    const isSelected = isSameDay(d, selectedDate);
                    const isToday = isSameDay(d, new Date());
                    return (
                        <Pressable
                            key={i}
                            onPress={() => setSelectedDate(d)}
                            style={[
                                styles.datePill,
                                isSelected && { backgroundColor: colors.pink },
                            ]}
                        >
                            <Text style={[
                                styles.dateNum,
                                { color: isSelected ? '#fff' : isToday ? colors.pink : colors.textPrimary },
                            ]}>
                                {d.getDate()}
                            </Text>
                            {isToday && !isSelected && (
                                <View style={[styles.todayDot, { backgroundColor: colors.pink }]} />
                            )}
                        </Pressable>
                    );
                })}
            </View>

            {/* Selected day label */}
            <Text style={[styles.dayHeading, { color: colors.textPrimary }]}>
                {formatLongDate(selectedDate)}
            </Text>

            {/* Bookings list */}
            <SectionList
                sections={[{ title: '', data: dayBookings }]}
                keyExtractor={(item) => String(item.booking_id)}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
                renderItem={({ item }) => (
                    <BookingCard item={item} colors={colors} router={router} onConfirm={handleConfirm} />
                )}
                ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
                ListEmptyComponent={
                    !loading ? (
                        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <MaterialCommunityIcons name="calendar-blank-outline" size={52} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No bookings for this day.</Text>
                        </View>
                    ) : null
                }
                renderSectionHeader={() => null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingTop: Spacing.md, marginBottom: Spacing.sm,
    },
    title: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
    todayBtn: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    modeBar: {
        flexDirection: 'row', marginHorizontal: Spacing.md,
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: 4, marginBottom: Spacing.md,
    },
    modeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: BorderRadius.lg },
    modeBtnText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    monthNav: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    },
    monthLabel: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
    weekRow: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: 6 },
    dayLabel: {
        flex: 1, textAlign: 'center',
        fontFamily: Fonts.medium, fontSize: FontSizes.xs,
    },
    weekDates: { flexDirection: 'row', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
    datePill: {
        flex: 1, alignItems: 'center', paddingVertical: 8,
        borderRadius: BorderRadius.full,
    },
    dateNum: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    todayDot: {
        width: 4, height: 4, borderRadius: 2, marginTop: 2,
    },
    dayHeading: {
        fontFamily: Fonts.bold, fontSize: FontSizes.lg,
        paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    },
    list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
    card: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
    cardService: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2 },
    cardCustomer: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
    badgeText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.md },
    metaText: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    cardActions: { flexDirection: 'row', gap: Spacing.sm },
    empty: {
        padding: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1,
        alignItems: 'center', marginTop: Spacing.lg,
    },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md, marginTop: Spacing.sm },
});
