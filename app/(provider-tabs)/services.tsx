import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { Service } from '@/types/api.types';
import { FormInput, GlassView } from '@/components';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { BorderRadius, Fonts, FontSizes, Shadows, Spacing } from '@/constants/theme';
import { useTabReload } from '@/hooks/useTabReload';

type Filter = 'all' | 'enabled' | 'disabled' | 'pending';
type SortMode = 'latest' | 'price-desc' | 'duration-asc';

type ServiceBadge = {
    label: string;
    color: string;
    backgroundColor: string;
    progressColor: string;
    locked: boolean;
};

function getServiceBadge(item: Service): ServiceBadge {
    const status = String(item.status || '').toLowerCase();
    const isPending = status === 'pending';
    const isRejected = status === 'rejected';
    const isActive = item.is_active && !isPending && !isRejected;

    if (isPending) {
        return {
            label: 'Pending',
            color: '#F59E0B',
            backgroundColor: 'rgba(245,158,11,0.15)',
            progressColor: '#F59E0B',
            locked: true,
        };
    }

    if (isRejected) {
        return {
            label: 'Rejected',
            color: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.15)',
            progressColor: '#EF4444',
            locked: true,
        };
    }

    if (isActive) {
        return {
            label: 'Enabled',
            color: '#10B981',
            backgroundColor: 'rgba(16,185,129,0.15)',
            progressColor: '#10B981',
            locked: false,
        };
    }

    return {
        label: 'Disabled',
        color: '#EF4444',
        backgroundColor: 'rgba(239,68,68,0.15)',
        progressColor: '#EF4444',
        locked: false,
    };
}

function ServiceCard({
    item,
    colors,
    router,
    onToggle,
    index,
    isDark,
    toggling,
}: {
    item: Service;
    colors: any;
    router: any;
    onToggle: (id: number) => void;
    index: number;
    isDark: boolean;
    toggling: boolean;
}) {
    const badge = getServiceBadge(item);
    const canToggle = !badge.locked && !toggling;
    const showImage = Boolean(item.image_url);
    const toggleLabel = badge.locked ? badge.label : item.is_active ? 'Disable' : 'Enable';
    const toggleIcon = badge.locked
        ? 'lock-outline'
        : item.is_active
            ? 'toggle-switch'
            : 'toggle-switch-off-outline';

    const handleNavigate = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/provider-service/${item.service_id}`);
    };

    const handleToggle = () => {
        if (!canToggle) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onToggle(item.service_id);
    };

    return (
        <Animated.View
            entering={FadeInUp.delay(index * 50).duration(400)}
            style={styles.cardWrapper}
        >
            <GlassView
                intensity={isDark ? 20 : 40}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.serviceCard, { borderColor: colors.cardBorder }]}
            >
                <View style={styles.cardTopSection}>
                    <View style={[styles.serviceImage, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                        {showImage ? (
                            <Image source={{ uri: item.image_url! }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                        ) : (
                            <MaterialCommunityIcons name="car-wrench" size={32} color={colors.pink} />
                        )}
                    </View>

                    <View style={styles.serviceInfo}>
                        <View style={styles.serviceHeaderRow}>
                            <Text style={[styles.serviceName, { color: colors.textPrimary }]} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: badge.backgroundColor }]}>
                                <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                                    {badge.label}
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.servicePrice, { color: colors.textSecondary }]}>
                            {Number(item.price).toLocaleString('en-EG')} EGP
                        </Text>

                        <View style={styles.serviceMetaRow}>
                            <View style={[styles.serviceMetaTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                <View style={[styles.serviceMetaFill, { backgroundColor: badge.progressColor }]} />
                            </View>
                            <Text style={[styles.durationText, { color: badge.color }]}>{item.duration} min</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.cardBottomSection, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <View style={styles.actionRow}>
                        <Pressable
                            style={[
                                styles.serviceControls,
                                {
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    opacity: badge.locked ? 0.65 : 1,
                                },
                            ]}
                            disabled={!canToggle}
                            onPress={handleToggle}
                        >
                            {toggling ? (
                                <ActivityIndicator size="small" color={colors.pink} style={styles.toggleLoader} />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name={toggleIcon as any} size={20} color={badge.locked ? colors.textMuted : badge.color} />
                                    <Text style={[styles.serviceControlText, { color: badge.locked ? colors.textMuted : colors.textPrimary }]}>
                                        {toggleLabel}
                                    </Text>
                                </>
                            )}
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.viewDetailsBtn,
                                { backgroundColor: colors.purple, opacity: pressed ? 0.8 : 1 },
                            ]}
                            onPress={handleNavigate}
                        >
                            <Text style={styles.viewDetailsBtnText}>View Details</Text>
                        </Pressable>
                    </View>
                </View>
            </GlassView>
        </Animated.View>
    );
}

export default function ServicesScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showToast } = useToast();

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sortMode, setSortMode] = useState<SortMode>('latest');
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const listRef = useRef<FlatList<Service>>(null);
    const hasLoaded = useRef(false);

    const load = useCallback(async (isSilent = false) => {
        try {
            if (!isSilent && !hasLoaded.current) setLoading(true);
            const res = await providerService.getMyServices();
            if (res.success && res.data) {
                setServices(res.data);
                hasLoaded.current = true;
            }
        } catch (err: any) {
            showToast('error', 'Error', err?.message || 'Failed to load services.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    useFocusEffect(useCallback(() => { load(hasLoaded.current); }, [load]));

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        load(true);
    }, [load]);

    useTabReload('services', () => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        onRefresh();
    });

    const handleToggle = useCallback(async (id: number) => {
        if (togglingId !== null) return;

        setTogglingId(id);
        try {
            const res = await providerService.toggleServiceActive(id);
            if (res.success && res.data) {
                setServices(prev => prev.map(service => service.service_id === id ? res.data! : service));
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch {
            showToast('error', 'Error', 'Failed to toggle service.');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setTogglingId(null);
        }
    }, [showToast, togglingId]);

    const filtered = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return services
            .filter((service) => {
                const status = String(service.status || '').toLowerCase();
                const matchQuery =
                    service.name.toLowerCase().includes(normalizedQuery) ||
                    (service.category_name || '').toLowerCase().includes(normalizedQuery);

                if (filter === 'pending') return matchQuery && status === 'pending';
                if (filter === 'enabled') return matchQuery && service.is_active && status !== 'pending';
                if (filter === 'disabled') return matchQuery && !service.is_active && status !== 'pending';
                return matchQuery;
            })
            .sort((left, right) => {
                if (sortMode === 'price-desc') return Number(right.price) - Number(left.price);
                if (sortMode === 'duration-asc') return Number(left.duration) - Number(right.duration);
                return Number(right.service_id) - Number(left.service_id);
            });
    }, [filter, query, services, sortMode]);

    const totals = useMemo(() => services.reduce(
        (acc, service) => {
            acc.total += 1;
            if (service.is_active) acc.enabled += 1;
            else acc.disabled += 1;
            return acc;
        },
        { total: 0, enabled: 0, disabled: 0 }
    ), [services]);

    const filterOptions: { key: Filter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'enabled', label: 'Enabled' },
        { key: 'disabled', label: 'Disabled' },
    ];

    const renderServiceItem = useCallback(({ item, index }: { item: Service; index: number }) => (
        <ServiceCard
            item={item}
            colors={colors}
            router={router}
            onToggle={handleToggle}
            index={index}
            isDark={isDark}
            toggling={togglingId === item.service_id}
        />
    ), [colors, handleToggle, isDark, router, togglingId]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

            <FlatList
                ref={listRef}
                data={filtered}
                renderItem={renderServiceItem}
                keyExtractor={(item) => String(item.service_id)}
                contentContainerStyle={[styles.listContent, { paddingTop: insets.top + Spacing.md }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <View style={styles.headerTop}>
                            <View>
                                <Text style={[styles.title, { color: colors.textPrimary }]}>Services</Text>
                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your service catalog</Text>
                            </View>

                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/add-service');
                                }}
                                hitSlop={8}
                                style={[styles.headerAction, { backgroundColor: colors.pink }]}
                            >
                                <MaterialCommunityIcons name="plus" size={18} color={colors.white} />
                                <Text style={[styles.headerActionText, { color: colors.white }]}>Add</Text>
                            </Pressable>
                        </View>

                        <View style={styles.statsRow}>
                            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.total}</Text>
                                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Total Services</Text>
                            </GlassView>
                            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.enabled}</Text>
                                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Enabled</Text>
                            </GlassView>
                            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statsCard, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.disabled}</Text>
                                <Text style={[styles.statsLabel, { color: colors.textSecondary }]}>Disabled</Text>
                            </GlassView>
                        </View>

                        <View style={styles.searchWrap}>
                            <FormInput
                                icon="magnify"
                                placeholder="Search services..."
                                value={query}
                                onChangeText={setQuery}
                            />
                        </View>

                        <ScrollView
                            style={styles.controlsScroll}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterRow}
                        >
                            {filterOptions.map((option) => {
                                const isActive = filter === option.key;
                                return (
                                    <Pressable
                                        key={option.key}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setFilter(option.key);
                                        }}
                                        style={[
                                            styles.filterChip,
                                            {
                                                backgroundColor: isActive ? colors.pink : (isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'),
                                                borderColor: isActive ? colors.pink : colors.cardBorder,
                                            },
                                        ]}
                                    >
                                        <Text style={[styles.filterText, { color: isActive ? colors.white : colors.textPrimary }]}>
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>

                        <ScrollView
                            style={styles.controlsScroll}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.sortRow}
                        >
                            {([
                                { key: 'latest', label: 'Latest' },
                                { key: 'price-desc', label: 'Price' },
                                { key: 'duration-asc', label: 'Duration' },
                            ] as const).map((option) => {
                                const isActive = sortMode === option.key;
                                return (
                                    <Pressable
                                        key={option.key}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSortMode(option.key);
                                        }}
                                        style={[
                                            styles.sortChip,
                                            {
                                                backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                                borderColor: isActive ? colors.pink : colors.cardBorder,
                                            },
                                        ]}
                                    >
                                        <MaterialCommunityIcons name="sort" size={14} color={isActive ? colors.pink : colors.textMuted} />
                                        <Text style={[styles.sortText, { color: isActive ? colors.pink : colors.textMuted }]}>{option.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color={colors.pink} style={styles.loadingState} />
                    ) : (
                        <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.emptyState, { borderColor: colors.cardBorder }]}>
                            <MaterialCommunityIcons name="wrench-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {query ? 'No services match your search.' : 'No services found'}
                            </Text>
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
    listContent: {
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
    headerAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    headerActionText: {
        fontFamily: Fonts.bold,
        fontSize: 12,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    statsCard: {
        flex: 1,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    statsValue: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    statsLabel: {
        fontFamily: Fonts.medium,
        fontSize: 10,
        textAlign: 'center',
    },
    searchWrap: {
        marginBottom: Spacing.md,
    },
    controlsScroll: {
        marginHorizontal: -Spacing.md,
        marginBottom: Spacing.sm,
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
        fontSize: FontSizes.sm,
    },
    sortRow: {
        paddingHorizontal: Spacing.md,
        gap: Spacing.sm,
        paddingBottom: 4,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: 4,
    },
    sortText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
    cardWrapper: {
        marginBottom: Spacing.md,
    },
    serviceCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        ...Shadows.sm,
    },
    cardTopSection: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    serviceImage: {
        width: 80,
        height: 80,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    serviceInfo: {
        flex: 1,
        marginLeft: Spacing.md,
        justifyContent: 'space-between',
    },
    serviceHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    serviceName: {
        flex: 1,
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusBadgeText: {
        fontFamily: Fonts.bold,
        fontSize: 10,
    },
    servicePrice: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
        marginTop: 2,
        marginBottom: 8,
    },
    serviceMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    serviceMetaTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    serviceMetaFill: {
        width: '100%',
        height: '100%',
        borderRadius: 3,
    },
    durationText: {
        fontFamily: Fonts.medium,
        fontSize: 12,
        minWidth: 48,
        textAlign: 'right',
    },
    cardBottomSection: {
        paddingTop: Spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    serviceControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 10,
        height: 40,
        minWidth: 104,
        gap: 6,
    },
    serviceControlText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
    toggleLoader: {
        minWidth: 72,
    },
    viewDetailsBtn: {
        flex: 1,
        height: 40,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewDetailsBtnText: {
        color: '#FFF',
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
    loadingState: {
        marginTop: 100,
    },
    emptyState: {
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        marginTop: 50,
    },
    emptyText: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
        marginTop: Spacing.md,
        textAlign: 'center',
    },
});
