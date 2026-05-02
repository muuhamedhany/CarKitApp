import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CenteredHeader } from '@/components';
import { GradientButton, OutlinedButton } from '@/components';
import { providerService } from '@/services/api/provider.service';
import { ProviderBooking } from '@/types/api.types';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'in-progress', 'completed', 'cancelled'] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_TINTS: Record<string, { bg: string; fg: string }> = {
    pending: { bg: 'rgba(255,183,77,0.18)', fg: '#FFB74D' },
    confirmed: { bg: 'rgba(129,140,248,0.18)', fg: '#818CF8' },
    'in-progress': { bg: 'rgba(205,66,168,0.18)', fg: '#CD42A8' },
    completed: { bg: 'rgba(16,185,129,0.18)', fg: '#10B981' },
    cancelled: { bg: 'rgba(239,68,68,0.18)', fg: '#EF4444' },
    all: { bg: 'rgba(205,66,168,0.18)', fg: '#CD42A8' },
};

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

const getMetaLine = (booking: ProviderBooking) => {
    const parts = [booking.street, booking.city, booking.building, booking.apartment].filter(Boolean);
    return parts.join(' • ');
};

function BookingCard({
    item,
    colors,
    onPressDetails,
    onQuickConfirm,
}: {
    item: ProviderBooking;
    colors: any;
    onPressDetails: () => void;
    onQuickConfirm: () => void;
}) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    const statusKey = (item.status || 'all').toLowerCase();
    const tint = STATUS_TINTS[statusKey] || STATUS_TINTS.all;
    const isPending = statusKey === 'pending';

    return (
        <View style={[styles.card, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTextBlock}>
                    <Text style={[styles.cardService, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.service_name}
                    </Text>
                    <Text style={[styles.cardCustomer, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.customer_name}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.statusText, { color: tint.fg }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.metaRow}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>{formatDate(item.booking_date)}</Text>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} style={{ marginLeft: 8 }} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {formatTime(item.start_time)} {item.end_time ? `- ${formatTime(item.end_time)}` : ''}
                </Text>
            </View>

            {getMetaLine(item) ? (
                <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {getMetaLine(item)}
                    </Text>
                </View>
            ) : null}

            <View style={styles.footerRow}>
                <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Total</Text>
                <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{formatMoney(item.booking_price)}</Text>
            </View>

            <View style={styles.actionsRow}>
                {isPending ? (
                    <OutlinedButton
                        title="Confirm"
                        onPress={onQuickConfirm}
                        style={{ flex: 1 }}
                    />
                ) : null}
                <AnimatedPressable
                    style={[styles.detailsButton, animatedStyle]}
                    onPressIn={() => {
                        scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
                    }}
                    onPressOut={() => {
                        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
                    }}
                    onPress={onPressDetails}
                >
                    <GradientButton title="View Details" onPress={onPressDetails} style={{ flex: 1 }} />
                </AnimatedPressable>
            </View>
        </View>
    );
}

export default function ProviderBookingsScreen() {
    const { colors } = useTheme();
    const { showToast } = useToast();
    const router = useRouter();

    const [filter, setFilter] = useState<StatusFilter>('all');
    const [bookings, setBookings] = useState<ProviderBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const loadBookings = useCallback(async (pageNum = 1, isRefresh = false) => {
        try {
            if (pageNum === 1 && !isRefresh) setLoading(true);
            if (pageNum > 1) setLoadingMore(true);

            const response = await providerService.getBookings(filter, undefined, pageNum, 10, debouncedSearch);
            if (response.success && response.data) {
                const newBookings = response.data;
                setBookings(prev => pageNum === 1 ? newBookings : [...prev, ...newBookings]);
                
                if (response.pagination) {
                    setHasMore(pageNum < response.pagination.totalPages);
                } else {
                    setHasMore(false);
                }
            }
        } catch {
            showToast('error', 'Error', 'Failed to load bookings.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [filter, debouncedSearch, showToast]);

    useFocusEffect(
        useCallback(() => {
            setPage(1);
            setHasMore(true);
            loadBookings(1);
        }, [loadBookings])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setPage(1);
        await loadBookings(1, true);
    }, [loadBookings]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadBookings(nextPage);
        }
    };

    // Server-side filtering removes the need for local counting. We'll just display labels without counts.

    const handleConfirm = async (bookingId: number) => {
        try {
            const response = await providerService.updateBookingStatus(bookingId, 'confirmed');
            if (!response.success) {
                showToast('error', 'Update Failed', response.message || 'Could not confirm booking.');
                return;
            }
            setBookings((current) => current.map((booking) => booking.booking_id === bookingId ? { ...booking, status: 'confirmed' } : booking));
            showToast('success', 'Booking Confirmed', 'The booking status has been updated.');
        } catch {
            showToast('error', 'Update Failed', 'Could not confirm booking.');
        }
    };

    const visibleBookings = bookings;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CenteredHeader title="Bookings" titleColor={colors.textPrimary} />

            <View style={styles.filterRow}>
                {STATUS_FILTERS.map((status) => {
                    const active = filter === status;
                    const label = status === 'all' ? 'All' : status.replace('-', ' ');
                    return (
                        <Pressable
                            key={status}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: active ? colors.pink : colors.backgroundSecondary,
                                    borderColor: active ? colors.pink : colors.cardBorder,
                                },
                            ]}
                            onPress={() => setFilter(status)}
                        >
                            <Text style={[styles.filterLabel, { color: active ? colors.white : colors.textSecondary }]}>
                                {label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : visibleBookings.length === 0 ? (
                <View style={styles.centered}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>No bookings found</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Try another status filter.</Text>
                </View>
            ) : (
                <FlashList
                    data={visibleBookings}
                    keyExtractor={(item) => String(item.booking_id)}
                    renderItem={({ item }) => (
                        <BookingCard
                            item={item}
                            colors={colors}
                            onPressDetails={() => router.push(`/provider-booking/${item.booking_id}`)}
                            onQuickConfirm={() => handleConfirm(item.booking_id)}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.pink} style={{ marginVertical: 20 }} /> : null}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
                    estimatedItemSize={150}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
    filterRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    filterChip: {
        borderWidth: 1,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
    },
    filterLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
    card: {
        borderWidth: 1,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    cardTextBlock: { flex: 1, marginRight: Spacing.sm },
    cardService: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
    cardCustomer: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
    statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    metaText: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    priceLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs },
    priceValue: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    actionsRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    detailsButton: { flex: 1 },
    emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginTop: Spacing.md },
    emptySubtitle: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4, textAlign: 'center' },
});
