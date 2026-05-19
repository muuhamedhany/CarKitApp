import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, RefreshControl, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { vendorService } from '@/services/api/vendor.service';
import { VendorOrder } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { FormInput, GlassView } from '@/components';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useTabReload } from '@/hooks/useTabReload';

type OrderFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export default function VendorOrdersScreen() {
    const { colors, isDark } = useTheme();
    const { showToast } = useToast();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [orders, setOrders] = useState<VendorOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const listRef = useRef<FlatList>(null);
    const hasLoaded = useRef(false);
    
    useTabReload('orders', () => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        onRefresh();
    });
    
    // Use a ref for debounced search so loadOrders keeps a stable identity
    const debouncedSearchRef = useRef('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            debouncedSearchRef.current = searchQuery;
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const showToastRef = useRef(showToast);
    showToastRef.current = showToast;

    const isLoadingRef = useRef(false);

    const loadOrders = useCallback(async (pageNum = 1, isRefresh = false) => {
        if (!user) return;
        if (isLoadingRef.current && !isRefresh) return;
        
        const currentSearch = debouncedSearchRef.current;
        
        try {
            isLoadingRef.current = true;
            // Only show full loading on first mount
            if (pageNum === 1 && !isRefresh && !hasLoaded.current) setLoading(true);
            if (pageNum > 1) setLoadingMore(true);
            
            const res = await vendorService.getOrders(activeFilter, pageNum, 10, currentSearch || undefined);

            if (res.success && res.data) {
                const newOrders = res.data;
                setOrders(prev => pageNum === 1 ? newOrders : [...prev, ...newOrders]);
                hasLoaded.current = true;
                
                if (res.pagination) {
                    setHasMore(pageNum < res.pagination.totalPages);
                } else {
                    setHasMore(false);
                }
            }
        } catch (error: any) {
            showToastRef.current('error', 'Error', error?.message || 'Failed to load orders.');
        } finally {
            isLoadingRef.current = false;
            setLoading(false);
            setLoadingMore(false);
            setRefreshing(false);
        }
    }, [activeFilter]);

    // Initial load + load on filter/search change
    useEffect(() => {
        setPage(1);
        setHasMore(true);
        loadOrders(1);
    }, [activeFilter, debouncedSearch, loadOrders]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setPage(1);
        loadOrders(1, true);
    }, [loadOrders]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadOrders(nextPage);
        }
    };

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'delivered') return '#10B981';
        if (s === 'pending') return '#F59E0B';
        if (s === 'processing') return '#6366F1';
        if (s === 'shipped') return '#3B82F6';
        if (s === 'cancelled') return '#EF4444';
        return colors.textSecondary;
    };

    const renderOrderItem = useCallback(({ item, index }: { item: VendorOrder, index: number }) => (
        <Animated.View 
            entering={FadeInUp.delay(index * 50).duration(400)}
            style={styles.orderCard}
        >
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/order/${item.order_id}?role=vendor`);
                }}
                style={({ pressed }) => [
                    styles.orderPressable,
                    { backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }
                ]}
            >
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={styles.orderContent}>
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={[styles.orderId, { color: colors.textPrimary }]}>Order #{item.order_id}</Text>
                            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
                                {new Date(item.order_date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.orderDivider, { backgroundColor: colors.cardBorder }]} />

                    <View style={styles.orderFooter}>
                        <View style={styles.customerInfo}>
                            <MaterialCommunityIcons name="account-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.customerName, { color: colors.textSecondary }]} numberOfLines={1}>
                                {item.customer_name}
                            </Text>
                        </View>
                        <Text style={[styles.orderAmount, { color: colors.pink }]}>
                            {Number(item.total_amount).toLocaleString('en-EG')} EGP
                        </Text>
                    </View>
                </GlassView>
            </Pressable>
        </Animated.View>
    ), [colors, isDark, router]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

            <FlatList
                ref={listRef}
                data={orders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.order_id.toString()}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View>
                                <Text style={[styles.title, { color: colors.textPrimary }]}>Orders</Text>
                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your sales and delivery</Text>
                            </View>
                        </View>

                        <View style={styles.searchWrap}>
                            <FormInput
                                icon="magnify"
                                placeholder="Search by Order ID or Customer..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterRow}
                            style={styles.filterScroll}
                        >
                            {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as OrderFilter[]).map((filter) => {
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
                                                backgroundColor: isActive ? colors.pink : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'),
                                                borderColor: isActive ? colors.pink : colors.cardBorder 
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.filterText, { color: isActive ? colors.white : colors.textPrimary }]}>
                                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                }
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
                showsVerticalScrollIndicator={false}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'} />
                }
                ListFooterComponent={() => (
                    loadingMore ? (
                        <ActivityIndicator size="small" color={colors.pink} style={{ paddingVertical: Spacing.md }} />
                    ) : <View style={{ height: 40 }} />
                )}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color={colors.pink} style={{ marginTop: 50 }} />
                    ) : (
                        <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={styles.emptyState}>
                            <MaterialCommunityIcons name="receipt-text-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No orders found</Text>
                        </GlassView>
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
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 100,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontFamily: Fonts.extraBold,
        fontSize: 32,
        letterSpacing: -1,
    },
    subtitle: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
        marginTop: 4,
    },
    searchWrap: {
        marginBottom: Spacing.md,
    },
    filterScroll: {
        marginHorizontal: -Spacing.md,
    },
    filterRow: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        paddingBottom: 4,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    filterText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
    },
    orderCard: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.xl,
        overflow: 'hidden',
    },
    orderPressable: {
        borderRadius: BorderRadius.xl,
    },
    orderContent: {
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        ...Shadows.sm,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    orderId: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    orderDate: {
        fontFamily: Fonts.medium,
        fontSize: 10,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontFamily: Fonts.bold,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    orderDivider: {
        height: 1,
        marginVertical: Spacing.md,
        opacity: 0.5,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    customerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    customerName: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
    },
    orderAmount: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        marginTop: 40,
    },
    emptyText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
        marginTop: Spacing.md,
    },
});
