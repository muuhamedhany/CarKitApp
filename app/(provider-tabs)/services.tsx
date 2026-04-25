import { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable, TextInput, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { Service } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { GradientButton } from '@/components';

type Filter = 'all' | 'enabled' | 'disabled';

function ServiceCard({ item, colors, router, onToggle }: {
    item: Service; colors: any; router: any;
    onToggle: (id: number) => void;
}) {
    const isActive = item.is_active;
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
                <Pressable onPress={() => onToggle(item.service_id)}>
                    <View style={[
                        styles.badge,
                        { backgroundColor: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }
                    ]}>
                        <Text style={[
                            styles.badgeText,
                            { color: isActive ? '#10B981' : '#EF4444' }
                        ]}>
                            {isActive ? 'Enabled' : 'Disabled'}
                        </Text>
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

    const filtered = services.filter(s => {
        const matchQ = s.name.toLowerCase().includes(query.toLowerCase());
        if (filter === 'enabled') return matchQ && s.is_active;
        if (filter === 'disabled') return matchQ && !s.is_active;
        return matchQ;
    });

    const filterOptions: { key: Filter; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'enabled', label: 'Enabled' },
        { key: 'disabled', label: 'Disabled' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Services Management</Text>
                <Pressable
                    onPress={() => router.push('/add-service')}
                    style={[styles.addBtn, { backgroundColor: colors.pink }]}
                >
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                </Pressable>
            </View>

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
                <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search for Services..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                />
            </View>

            {/* Filter pills */}
            <View style={styles.filterRow}>
                {filterOptions.map(f => (
                    <Pressable
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        style={[
                            styles.filterPill,
                            {
                                backgroundColor: filter === f.key ? colors.pink : colors.card,
                                borderColor: filter === f.key ? colors.pink : colors.border,
                            },
                        ]}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: filter === f.key ? '#fff' : colors.textMuted },
                        ]}>
                            {f.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

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
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.md, paddingTop: Spacing.md, marginBottom: Spacing.md,
    },
    title: { fontFamily: Fonts.bold, fontSize: FontSizes.xl },
    addBtn: {
        width: 36, height: 36, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
        borderRadius: BorderRadius.full, borderWidth: 1,
        paddingHorizontal: Spacing.md, paddingVertical: 10,
        marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    },
    searchInput: { flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.md },
    filterRow: {
        flexDirection: 'row', gap: Spacing.sm,
        paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
    },
    filterPill: {
        paddingHorizontal: Spacing.md, paddingVertical: 6,
        borderRadius: BorderRadius.full, borderWidth: 1,
    },
    filterText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
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
