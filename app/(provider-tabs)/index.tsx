import { useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import { ProviderDashboardResponse } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { DashboardSkeleton } from '@/components/common/SkeletonPlaceholder';

function getStatusTint(status: string, colors: any) {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return { bg: 'rgba(16,185,129,0.15)', fg: '#10B981' };
    if (s === 'confirmed') return { bg: 'rgba(99,102,241,0.15)', fg: '#818CF8' };
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' };
    return { bg: colors.pinkGlow, fg: colors.pink };
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
                subtitle: 'Scheduled today',
            },
            {
                label: 'Total Customers',
                value: String(dashboard.stats.total_customers),
                icon: 'account-group',
                color: '#818CF8',
                subtitle: 'Served customers',
            },
            {
                label: 'Revenue',
                value: `${Number(dashboard.stats.revenue).toLocaleString('en-EG')}`,
                icon: 'cash-multiple',
                color: colors.pink,
                subtitle: 'All time',
            },
            {
                label: 'Growth',
                value: `${dashboard.stats.growth_pct >= 0 ? '+' : ''}${dashboard.stats.growth_pct}%`,
                icon: 'trending-up',
                color: '#10B981',
                subtitle: 'Vs previous period',
            },
        ]
        : [];

    const formatTime = (value: string | null) => {
        if (!value) return 'Time not set';
        return value.slice(0, 5);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.greeting, { color: colors.textMuted }]}>Hello, {user?.name}</Text>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Dashboard</Text>
                </View>

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* Stats Grid */}
                        <View style={styles.statsContainer}>
                            {stats.map((stat) => (
                                <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <View style={[styles.iconContainer, { backgroundColor: `${stat.color}18` }]}>
                                        <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                                    </View>
                                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
                                    <Text style={[styles.statSubtitle, { color: colors.textMuted }]}>{stat.subtitle}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.quickActions}>
                            <Pressable
                                onPress={() => router.push('/(provider-tabs)/services')}
                                style={[styles.quickAction, { borderColor: colors.cardBorder, backgroundColor: colors.primary }]}
                            >
                                <MaterialCommunityIcons name="wrench" size={20} color={colors.white} />
                                <Text style={[styles.quickActionText, { color: colors.white }]}>Services</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => router.push('/(provider-tabs)/bookings')}
                                style={[styles.quickAction, { borderColor: colors.cardBorder, backgroundColor: colors.purpleDark }]}
                            >
                                <MaterialCommunityIcons name="calendar-check" size={20} color={colors.white} />
                                <Text style={[styles.quickActionText, { color: colors.white }]}>Bookings</Text>
                            </Pressable>
                        </View>

                        <Pressable
                            onPress={() => router.push('/provider-analytics')}
                            style={[styles.analyticsCard, { borderColor: colors.pink }]}
                        >
                            <View style={[styles.analyticsIcon, { backgroundColor: colors.purpleGlow }]}>
                                <MaterialCommunityIcons name="chart-line" size={22} color={colors.pink} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.analyticsTitle, { color: colors.textPrimary }]}>Analytics</Text>
                                <Text style={[styles.analyticsSubtitle, { color: colors.textMuted }]}>Track service performance</Text>
                            </View>
                            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.pink} />
                        </Pressable>

                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today's Appointments</Text>
                                <Pressable onPress={() => router.push('/(provider-tabs)/bookings')}>
                                    <Text style={[styles.sectionLink, { color: colors.pink }]}>See All</Text>
                                </Pressable>
                            </View>

                            {dashboard?.todays_appointments.length ? (
                                dashboard.todays_appointments.map((appointment) => (
                                    <Pressable
                                        key={appointment.booking_id}
                                        onPress={() => router.push(`/provider-booking/${appointment.booking_id}`)}
                                        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    >
                                        <View style={styles.orderTopRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.orderCustomer, { color: colors.textPrimary }]}>{appointment.customer_name}</Text>
                                                <Text style={[styles.orderMeta, { color: colors.textMuted }]}>{appointment.service_name} · {formatTime(appointment.start_time)}</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusTint(appointment.status, colors).bg }]}>
                                                <Text style={[styles.statusBadgeText, { color: getStatusTint(appointment.status, colors).fg }]}>{appointment.status}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.orderBottomRow}>
                                            <Text style={[styles.orderMeta, { color: colors.textMuted }]}>Booking #{appointment.booking_id}</Text>
                                            <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>{Number(appointment.booking_price).toLocaleString('en-EG')} EGP</Text>
                                        </View>
                                    </Pressable>
                                ))
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
                                dashboard.popular_services.map((service) => (
                                    <View key={service.service_id} style={[styles.productRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                                        <View style={styles.productThumbPlaceholder}>
                                            <MaterialCommunityIcons name="wrench" size={18} color={colors.pink} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.productName, { color: colors.textPrimary }]}>{service.name}</Text>
                                            <Text style={[styles.productMeta, { color: colors.textMuted }]}>{service.booking_count} bookings</Text>
                                        </View>
                                        <Text style={[styles.productRevenue, { color: colors.pink }]}>
                                            {Number(service.revenue).toLocaleString('en-EG')} EGP
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
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: 100,
    },
    header: {
        marginBottom: Spacing.md,
    },
    greeting: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        marginBottom: Spacing.xs,
    },
    title: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xxl,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    statValue: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.xl,
        marginBottom: Spacing.xs,
    },
    statLabel: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
    },
    statSubtitle: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
        marginTop: 2,
        opacity: 0.7,
    },
    quickActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    quickAction: {
        flex: 1,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    quickActionText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    analyticsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        marginBottom: Spacing.lg,
    },
    analyticsIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyticsTitle: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    analyticsSubtitle: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    section: {
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    sectionLink: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.sm,
    },
    orderCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    orderTopRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    orderBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.sm,
    },
    orderCustomer: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    orderMeta: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    orderTotal: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.md,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusBadgeText: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
        textTransform: 'capitalize',
    },
    productRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.sm,
        marginBottom: Spacing.sm,
        gap: Spacing.sm,
    },
    productThumbPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(205,66,168,0.12)',
    },
    productName: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    productMeta: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    productRevenue: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.sm,
    },
    emptyState: {
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
});
