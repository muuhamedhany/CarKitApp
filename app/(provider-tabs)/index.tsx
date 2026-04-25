import { useCallback, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable, RefreshControl,
    FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { ProviderAppointment, ProviderDashboardResponse, ProviderPopularService } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { DashboardSkeleton } from '@/components/common/SkeletonPlaceholder';

function getStatusTint(status: string, colors: any) {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return { bg: 'rgba(16,185,129,0.15)', fg: '#10B981' };
    if (s === 'confirmed') return { bg: 'rgba(99,102,241,0.15)', fg: '#818CF8' };
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' };
    return { bg: colors.pinkGlow, fg: colors.pink };
}

function AppointmentCard({ item, colors, router }: { item: ProviderAppointment; colors: any; router: any }) {
    const tint = getStatusTint(item.status, colors);
    const time = item.start_time ? item.start_time.slice(0, 5) : '';
    return (
        <Pressable
            onPress={() => router.push(`/provider-booking/${item.booking_id}`)}
            style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <View style={styles.apptTopRow}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.apptService, { color: colors.textPrimary }]}>{item.service_name}</Text>
                    <Text style={[styles.apptCustomer, { color: colors.textMuted }]}>{item.customer_name}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: tint.bg }]}>
                    <Text style={[styles.statusText, { color: tint.fg }]}>{item.status}</Text>
                </View>
            </View>
            <View style={styles.apptMetaRow}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.apptMeta, { color: colors.textMuted }]}>{time}</Text>
            </View>
            <View style={[styles.apptDivider, { borderColor: colors.border }]} />
            <View style={styles.apptFooter}>
                <Text style={[styles.apptTotal, { color: colors.textMuted }]}>Total</Text>
                <Text style={[styles.apptPrice, { color: colors.textPrimary }]}>
                    {Number(item.booking_price).toLocaleString('en-EG')} EGP
                </Text>
            </View>
        </Pressable>
    );
}

export default function ProviderDashboard() {
    const { user } = useAuth();
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showToast } = useToast();

    const [dashboard, setDashboard] = useState<ProviderDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const res = await providerService.getDashboard();
            if (res.success && res.data) {
                setDashboard(res.data);
            }
        } catch (error: any) {
            showToast('error', 'Error', error?.message || 'Failed to load dashboard.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    }, [loadDashboard]);

    const stats = dashboard
        ? [
            {
                label: "Today's Bookings",
                value: String(dashboard.stats.todays_bookings),
                icon: 'calendar-check',
                color: '#F97316',
                bg: 'rgba(249,115,22,0.12)',
            },
            {
                label: 'Customers',
                value: String(dashboard.stats.total_customers),
                icon: 'account-group',
                color: '#818CF8',
                bg: 'rgba(129,140,248,0.12)',
            },
            {
                label: 'Revenue',
                value: `${Number(dashboard.stats.revenue).toLocaleString('en-EG')} EGP`,
                icon: 'cash',
                color: '#10B981',
                bg: 'rgba(16,185,129,0.12)',
            },
            {
                label: 'Growth',
                value: `${dashboard.stats.growth_pct >= 0 ? '+' : ''}${dashboard.stats.growth_pct}%`,
                icon: 'trending-up',
                color: colors.pink,
                bg: colors.pinkGlow,
            },
        ]
        : [];

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Dashboard</Text>
                </View>

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            {stats.map((s) => (
                                <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
                                        <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
                                    </View>
                                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
                                </View>
                            ))}
                        </View>

                        {/* My Services CTA */}
                        <LinearGradient
                            colors={['#CD42A8', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.myServicesCta}
                        >
                            <Pressable
                                style={styles.myServicesInner}
                                onPress={() => router.push('/(provider-tabs)/services')}
                            >
                                <MaterialCommunityIcons name="wrench" size={20} color="#fff" />
                                <Text style={styles.myServicesText}>My Services</Text>
                            </Pressable>
                        </LinearGradient>

                        {/* Analytics */}
                        <Pressable
                            onPress={() => router.push('/provider-analytics')}
                            style={[styles.analyticsBtn, { borderColor: colors.pink }]}
                        >
                            <MaterialCommunityIcons name="chart-bar" size={18} color={colors.pink} />
                            <Text style={[styles.analyticsBtnText, { color: colors.pink }]}>Analytics</Text>
                        </Pressable>

                        {/* Today's Appointments */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Appointments</Text>
                                <Pressable onPress={() => router.push('/(provider-tabs)/bookings')}>
                                    <Text style={[styles.sectionLink, { color: colors.pink }]}>See All</Text>
                                </Pressable>
                            </View>

                            {dashboard?.todays_appointments.length ? (
                                <FlatList
                                    data={dashboard.todays_appointments}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    keyExtractor={(i) => String(i.booking_id)}
                                    ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
                                    contentContainerStyle={{ paddingRight: Spacing.md }}
                                    renderItem={({ item }) => (
                                        <AppointmentCard item={item} colors={colors} router={router} />
                                    )}
                                    scrollEnabled
                                />
                            ) : (
                                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <MaterialCommunityIcons name="calendar-blank-outline" size={44} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No appointments today.</Text>
                                </View>
                            )}
                        </View>

                        {/* Popular Services */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Services</Text>
                                <Pressable onPress={() => router.push('/(provider-tabs)/services')}>
                                    <Text style={[styles.sectionLink, { color: colors.pink }]}>Manage</Text>
                                </Pressable>
                            </View>

                            {dashboard?.popular_services.length ? (
                                dashboard.popular_services.map((svc: ProviderPopularService) => (
                                    <View key={svc.service_id} style={[styles.svcRow, { borderColor: colors.border }]}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.svcName, { color: colors.textPrimary }]}>{svc.name}</Text>
                                            <Text style={[styles.svcMeta, { color: colors.textMuted }]}>{svc.booking_count} bookings</Text>
                                        </View>
                                        <Text style={[styles.svcRevenue, { color: colors.pink }]}>
                                            {Number(svc.revenue).toLocaleString('en-EG')} EGP
                                        </Text>
                                    </View>
                                ))
                            ) : (
                                <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <MaterialCommunityIcons name="wrench-outline" size={44} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No services yet. Add your first service!</Text>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: Spacing.md, paddingBottom: 100 },
    header: { marginBottom: Spacing.md },
    title: { fontFamily: Fonts.bold, fontSize: FontSizes.xxl },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
    statCard: {
        flex: 1, minWidth: '45%', padding: Spacing.md,
        borderRadius: BorderRadius.xl, borderWidth: 1,
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 22,
        alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
    },
    statValue: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 2 },
    statLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    myServicesCta: { borderRadius: BorderRadius.full, marginBottom: Spacing.sm },
    myServicesInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: Spacing.sm, paddingVertical: Spacing.md,
    },
    myServicesText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, color: '#fff' },
    analyticsBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: Spacing.sm, borderWidth: 1.5, borderRadius: BorderRadius.full,
        paddingVertical: Spacing.sm + 2, marginBottom: Spacing.lg,
    },
    analyticsBtnText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
    section: { marginBottom: Spacing.lg },
    sectionHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: Spacing.md,
    },
    sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    sectionLink: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    apptCard: {
        width: 220, padding: Spacing.md,
        borderRadius: BorderRadius.xl, borderWidth: 1,
    },
    apptTopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.xs },
    apptService: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginBottom: 2 },
    apptCustomer: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    apptMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
    apptMeta: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    apptDivider: { borderTopWidth: 1, marginVertical: Spacing.sm },
    apptFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    apptTotal: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    apptPrice: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
    statusText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs, textTransform: 'capitalize' },
    svcRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: Spacing.md, borderBottomWidth: 1,
    },
    svcName: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginBottom: 2 },
    svcMeta: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
    svcRevenue: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },
    emptyState: {
        padding: Spacing.xl, borderRadius: BorderRadius.xl, borderWidth: 1,
        alignItems: 'center', justifyContent: 'center',
    },
    emptyText: { fontFamily: Fonts.medium, fontSize: FontSizes.md, marginTop: Spacing.sm, textAlign: 'center' },
});
