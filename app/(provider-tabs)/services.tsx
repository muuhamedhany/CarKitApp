import { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { Service } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { FormInput, GradientButton } from '@/components';

type Filter = 'all' | 'enabled' | 'disabled' | 'pending';
type SortMode = 'latest' | 'price-desc' | 'duration-asc';

function ServiceCard({ item, colors, router, onToggle }: {
    item: Service; colors: any; router: any;
    onToggle: (id: number) => void;
}) {
    const isPending = item.status === 'pending';
    const isRejected = item.status === 'rejected';
    const isActive = item.is_active && !isPending && !isRejected;

    const badgeBg = isPending
        ? 'rgba(245,158,11,0.15)'
        : isRejected
            ? 'rgba(239,68,68,0.15)'
            : isActive
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(239,68,68,0.15)';

    const badgeColor = isPending ? '#F59E0B' : isRejected ? '#EF4444' : isActive ? '#10B981' : '#EF4444';
    const badgeLabel = isPending ? 'Pending' : isRejected ? 'Rejected' : isActive ? 'Enabled' : 'Disabled';

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.cardDuration, { color: colors.textMuted }]}>{item.duration} min</Text>
                    <Text style={[styles.cardPrice, { color: colors.pink }]}>
                        {Number(item.price).toLocaleString('en-EG')} EGP
                    </Text>
                </View>
                {/* Badge — tappable only when not pending/rejected */}
                <Pressable onPress={() => !isPending && !isRejected && onToggle(item.service_id)} disabled={isPending || isRejected}>
                    <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                        <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
                    </View>
                </Pressable>
            </View>
            <GradientButton
                title="View Details"
                onPress={() => router.push(`/provider-service/${item.service_id}`)}
                style={{ marginTop: Spacing.md }}
            />
        </View>
    );
}

export default function ServicesScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showToast } = useToast();

    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sortMode, setSortMode] = useState<SortMode>('latest');

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const res = await providerService.getMyServices();
            if (res.success && res.data) {
                setServices(res.data);
            }
        } catch (err: any) {
            showToast('error', 'Error', err?.message || 'Failed to load services.');
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

    const handleToggle = async (id: number) => {
        try {
            const res = await providerService.toggleServiceActive(id);
            if (res.success && res.data) {
                setServices(prev => prev.map(s => s.service_id === id ? res.data! : s));
            }
        } catch {
            showToast('error', 'Error', 'Failed to toggle service.');
        }
    };

    const filtered = services
        .filter((service) => {
            const matchQ = service.name.toLowerCase().includes(query.toLowerCase());
            if (filter === 'pending') return matchQ && service.status === 'pending';
            if (filter === 'enabled') return matchQ && service.is_active && service.status !== 'pending';
            if (filter === 'disabled') return matchQ && !service.is_active && service.status !== 'pending';
            return matchQ;
        })
        .sort((left, right) => {
            if (sortMode === 'price-desc') return Number(right.price) - Number(left.price);
            if (sortMode === 'duration-asc') return Number(left.duration) - Number(right.duration);
            return Number(right.service_id) - Number(left.service_id);
        });

    const totals = services.reduce(
        (acc, service) => {
            acc.total += 1;
            if (service.is_active) acc.enabled += 1;
            else acc.disabled += 1;
            return acc;
        },
        { total: 0, enabled: 0, disabled: 0 }
    );

    const filterOptions: { key: Filter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'enabled', label: 'Enabled' },
        { key: 'disabled', label: 'Disabled' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Services Management</Text>

                <View style={styles.statsRow}>
                    <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.total}</Text>
                        <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Total</Text>
                    </View>
                    <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statsValue, { color: '#10B981' }]}>{totals.enabled}</Text>
                        <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Enabled</Text>
                    </View>
                    <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statsValue, { color: colors.textPrimary }]}>{totals.disabled}</Text>
                        <Text style={[styles.statsLabel, { color: colors.textMuted }]}>Disabled</Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => router.push('/add-service')}
                    hitSlop={8}
                    style={[styles.headerAction, { backgroundColor: colors.pink }]}
                >
                    <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
                    <Text style={[styles.headerActionText, { color: colors.white }]}>Add Service</Text>
                </Pressable>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <FormInput
                    icon="magnify"
                    placeholder="Search services..."
                    value={query}
                    onChangeText={setQuery}
                />
            </View>

            {/* Filter pills */}
            <ScrollView
                style={styles.controlsScroll}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                {filterOptions.map((f) => (
                    <Pressable
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor: filter === f.key ? colors.pink : colors.backgroundSecondary,
                                borderColor: filter === f.key ? colors.pink : colors.cardBorder,
                            },
                        ]}
                    >
                        <Text style={[
                            styles.filterChipText,
                            { color: filter === f.key ? colors.white : colors.textPrimary },
                        ]}>
                            {f.label}
                        </Text>
                    </Pressable>
                ))}
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
                            onPress={() => setSortMode(option.key)}
                            style={[
                                styles.sortChip,
                                {
                                    backgroundColor: isActive ? colors.backgroundSecondary : colors.card,
                                    borderColor: isActive ? colors.pink : colors.border,
                                },
                            ]}
                        >
                            <MaterialCommunityIcons name="sort" size={14} color={isActive ? colors.pink : colors.textMuted} />
                            <Text style={[styles.sortText, { color: isActive ? colors.pink : colors.textMuted }]}>{option.label}</Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            <FlatList
                data={filtered}
                keyExtractor={(i) => String(i.service_id)}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
                ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
                renderItem={({ item }) => (
                    <ServiceCard item={item} colors={colors} router={router} onToggle={handleToggle} />
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <MaterialCommunityIcons name="wrench-outline" size={52} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {query ? 'No services match your search.' : 'No services yet. Tap + to add one.'}
                            </Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    title: { fontFamily: Fonts.bold, fontSize: FontSizes.xxl },
    headerAction: {
        paddingHorizontal: Spacing.md,
        minHeight: 42,
        borderRadius: BorderRadius.full,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerActionText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    searchWrap: {
        paddingHorizontal: Spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    statsCard: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.md,
    },
    statsValue: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    statsLabel: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
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
    },
    filterChipText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    sortRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        minHeight: 40,
    },
    sortText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.xs,
    },
    list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
    card: { borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.md },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
    cardName: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 2 },
    cardDuration: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: 4 },
    cardPrice: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full },
    badgeText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    empty: {
        padding: Spacing.xxl, borderRadius: BorderRadius.xl, borderWidth: 1,
        alignItems: 'center', marginTop: Spacing.xl,
    },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md, marginTop: Spacing.md, textAlign: 'center' },
});
