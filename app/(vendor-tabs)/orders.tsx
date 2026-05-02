import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, FlatList, RefreshControl, Animated, TextInput } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SkeletonBone } from '@/components/common/SkeletonPlaceholder';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { vendorService } from '@/services/api/vendor.service';
import { VendorOrder } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type OrderFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered';

export default function VendorOrdersScreen() {
    const { colors } = useTheme();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Debounce search query
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const loadOrders = useCallback(async (pageNum = 1, isRefresh = false) => {
        try {
            if (pageNum === 1 && !isRefresh) setLoading(true);
            if (pageNum > 1) setLoadingMore(true);
            
            const res = await vendorService.getOrders(activeFilter, pageNum, 10, debouncedSearch);
            if (res.success && res.data) {
                const newOrders = res.data;
                setOrders(prev => pageNum === 1 ? newOrders : [...prev, ...newOrders]);
                
                if (res.pagination) {
                    setHasMore(pageNum < res.pagination.totalPages);
                } else {
                    setHasMore(false);
                }
            }
        } catch (error: any) {
            showToast('error', 'Error', error?.message || 'Failed to load orders.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [activeFilter, debouncedSearch, showToast]);

    useFocusEffect(
        useCallback(() => {
            setPage(1);
            setHasMore(true);
            loadOrders(1);
        }, [loadOrders])
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setPage(1);
        await loadOrders(1, true);
    }, [loadOrders]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadOrders(nextPage);
        }
    };

    const formatDate = (value: string) => {
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? value
            : date.toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusPalette = (status: string) => {
        const normalized = (status || '').toLowerCase();
        if (normalized === 'delivered') return { bg: 'rgba(16,185,129,0.12)', fg: '#10B981' };
        if (normalized === 'shipped') return { bg: 'rgba(249,115,22,0.12)', fg: '#F97316' };
        if (normalized === 'processing') return { bg: 'rgba(99,102,241,0.12)', fg: '#6366F1' };
        if (normalized === 'pending') return { bg: 'rgba(205,66,168,0.12)', fg: colors.pink };
        return { bg: colors.pinkGlow, fg: colors.pink };
    };

    const getRelativeTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return formatDate(dateStr);
    };

    // Local filter removed in favor of server-side search
    const filteredOrders = orders;

    const renderHeader = () => (
        <>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Orders</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Track current vendor order flow.</Text>
            </View>

            <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                    placeholder="Search by order #, customer, status..."
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                )}
            </View>

            <ScrollView
                style={styles.controlsScroll}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                {(['all', 'pending', 'processing', 'shipped', 'delivered'] as OrderFilter[]).map((filter) => {
                    const isActive = activeFilter === filter;
                    return (
                        <Pressable
                            key={filter}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setActiveFilter(filter);
                            }}
                            style={[
                                styles.filterChip,
                                {
                                    backgroundColor: isActive ? colors.pink : colors.backgroundSecondary,
                                    borderColor: isActive ? colors.pink : colors.cardBorder,
                                },
                            ]}
                        >
                            <Text style={[styles.filterText, { color: isActive ? colors.white : colors.textPrimary }]}>
                                {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </>
    );

    const renderOrder = ({ item: order }: { item: VendorOrder }) => {
        const palette = getStatusPalette(order.status);
        const scaleAnim = new Animated.Value(1);
        const initial = (order.customer_name || '?').charAt(0).toUpperCase();

        const onPressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
        const onPressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

        return (
            <Pressable
                onPress={() => router.push({ pathname: '/order/[id]', params: { id: String(order.order_id), role: 'vendor' } })}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
            >
                <Animated.View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: palette.fg, borderLeftWidth: 3, transform: [{ scale: scaleAnim }] }]}>
                    <View style={styles.orderTopRow}>
                        <View style={[styles.customerAvatar, { backgroundColor: palette.bg }]}>
                            <Text style={[styles.customerAvatarText, { color: palette.fg }]}>{initial}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>Order #{order.order_id}</Text>
                            <Text style={[styles.orderMeta, { color: colors.textMuted }]}>{order.customer_name} · {getRelativeTime(order.order_date)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: palette.bg }]}>
                            <Text style={[styles.statusBadgeText, { color: palette.fg }]}>{order.status}</Text>
                        </View>
                    </View>

                    <View style={styles.orderStatsRow}>
                        <Text style={[styles.orderMeta, { color: colors.textMuted }]}>{order.item_count} items</Text>
                        <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>{Number(order.total_amount).toLocaleString('en-EG')} EGP</Text>
                    </View>

                    <View style={styles.chevronRow}>
                        <Text style={[styles.itemMeta, { color: colors.textMuted }]}>Tap to view details</Text>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
                    </View>
                </Animated.View>
            </Pressable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <FlatList
                data={loading ? [] : filteredOrders}
                keyExtractor={(item) => item.order_id.toString()}
                renderItem={renderOrder}
                ListHeaderComponent={renderHeader()}
                ItemSeparatorComponent={() => <View style={styles.orderSeparator} />}
                contentContainerStyle={styles.screenContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.pink} style={{ marginVertical: 20 }} /> : null}
                ListEmptyComponent={
                    loading && !refreshing ? (
                        <View style={{ padding: Spacing.md, gap: Spacing.md }}>
                            {[1, 2, 3].map(i => (
                                <View key={i} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border, padding: Spacing.md }]}>
                                    <View style={styles.orderTopRow}>
                                        <SkeletonBone width={40} height={40} borderRadius={20} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <SkeletonBone width={100} height={16} />
                                            <SkeletonBone width={140} height={12} style={{ marginTop: 6 }} />
                                        </View>
                                        <SkeletonBone width={70} height={24} borderRadius={12} />
                                    </View>
                                    <View style={styles.orderStatsRow}>
                                        <SkeletonBone width={60} height={14} />
                                        <SkeletonBone width={80} height={16} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={[styles.emptyState]}>
                            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders found.</Text>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xxl,
    },
    subtitle: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
        marginTop: 2,
    },
    controlsScroll: {
        flexGrow: 0,
        flexShrink: 0,
        maxHeight: 56,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    filterChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        minHeight: 40,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        alignSelf: 'flex-start',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    screenContent: {
        paddingBottom: 160,
    },
    loadingState: {
        marginTop: 50,
    },
    orderCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
    },
    orderSeparator: {
        height: Spacing.md,
    },
    orderTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    orderNumber: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    orderMeta: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    orderStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    orderTotal: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    statusBadge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
    },
    statusBadgeText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
        textTransform: 'capitalize',
    },
    chevronRow: {
        marginTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        paddingTop: Spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemMeta: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
    },
    emptyState: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.xl,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        height: 44,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
        height: '100%',
    },
    customerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    customerAvatarText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
});