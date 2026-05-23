import {
    useCallback,
    useState,
    useRef
} from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { providerService } from '@/services/api/provider.service';
import { notificationService } from '@/services/api/notification.service';
import { ProviderDashboardResponse } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { DashboardSkeleton } from '@/components/common/SkeletonPlaceholder';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GlassView } from '@/components';
import Text from '@/components/common/LocalizedText';
import { rowDirection } from '@/utils/rtl';

function getStatusTint(status: string, colors: any) {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return { bg: 'rgba(16,185,129,0.15)', fg: '#10B981' };
    if (s === 'confirmed') return { bg: 'rgba(99,102,241,0.15)', fg: '#818CF8' };
    if (s === 'cancelled') return { bg: 'rgba(239,68,68,0.15)', fg: '#EF4444' };
    return { bg: colors.pinkGlow, fg: colors.pink };
}

export default function ProviderDashboard() {
    const { user } = useAuth();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { showToast } = useToast();
    const { t, isRTL } = useTranslation();
    const currencySuffix = t('common.currency.egp');

    const [dashboard, setDashboard] = useState<ProviderDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const hasLoaded = useRef(false);

    const loadDashboard = useCallback(async () => {
        if (!user) return;
        try {
            if (!hasLoaded.current) setLoading(true);
            const res = await providerService.getDashboard();
            if (res.success && res.data) {
                setDashboard(res.data);
                hasLoaded.current = true;
            }
            try {
                const unreadRes = await notificationService.getUnreadCount();
                if (unreadRes.success && unreadRes.data) {
                    setUnreadCount(unreadRes.data.count);
                }
            } catch { /* non-blocking */ }
        } catch (error: any) {
            showToast('error', t('common.error'), error?.message || t('provider.dashboard.loadFailed'));
        } finally {
            setLoading(false);
        }
    }, [showToast, t, user]);

    useFocusEffect(useCallback(() => { loadDashboard(); }, [loadDashboard]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadDashboard();
        setRefreshing(false);
    }, [loadDashboard]);

    const stats = dashboard
        ? [
            {
                label: t('provider.dashboard.todayBookings'),
                value: String(dashboard.stats.todays_bookings),
                icon: 'calendar-check',
                color: '#F97316',
                subtitle: t('provider.dashboard.scheduledToday'),
                onPress: () => router.push('/(provider-tabs)/bookings')
            },
            {
                label: t('provider.dashboard.totalCustomers'),
                value: String(dashboard.stats.total_customers),
                icon: 'account-group',
                color: '#818CF8',
                subtitle: t('provider.dashboard.servedCustomers'),
                onPress: () => router.push('/(provider-tabs)/bookings')
            },
            {
                label: t('provider.dashboard.revenue'),
                value: `${Number(dashboard.stats.revenue).toLocaleString('en-EG')}`,
                icon: 'cash-multiple',
                color: colors.pink,
                subtitle: t('provider.dashboard.allTime'),
                onPress: () => router.push('/provider-analytics')
            },
            {
                label: t('provider.dashboard.growth'),
                value: `${dashboard.stats.growth_pct >= 0 ? '+' : ''}${dashboard.stats.growth_pct}%`,
                icon: 'trending-up',
                color: '#10B981',
                subtitle: t('provider.dashboard.vsPreviousPeriod'),
                onPress: () => router.push('/provider-analytics')
            },

        ]
        : [];

    const formatTime = (value: string | null) => {
        if (!value) return t('provider.dashboard.timeNotSet');
        return value.slice(0, 5);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View entering={FadeInDown.duration(800)} style={[styles.header, { flexDirection: rowDirection(isRTL) }]}>
                    <View style={styles.headerLeft}>
                        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('vendor.dashboard.hello')}</Text>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{user?.name?.split(' ')[0] || t('review.provider')}</Text>
                    </View>
                    <Pressable
                        style={[styles.notificationBtn, { backgroundColor: colors.glass, borderColor: colors.cardBorder }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/notifications');
                        }}
                    >
                        <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
                        {unreadCount > 0 && (
                            <View style={[styles.notificationCircleIndicator, { backgroundColor: colors.pink }]} />
                        )}
                    </Pressable>
                </Animated.View>

                {loading ? (
                    <DashboardSkeleton />
                ) : (
                    <>
                        {/* Stats Grid */}
                        <View style={styles.statsContainer}>
                            {stats.map((stat, index) => (
                                <Animated.View
                                    key={stat.label}
                                    entering={FadeInDown.delay(100 * index).duration(600)}
                                    style={styles.statWrapper}
                                >
                                    <Pressable
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            stat.onPress();
                                        }}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
                                    >
                                        <GlassView
                                            intensity={isDark ? 20 : 40}
                                            tint={isDark ? 'dark' : 'light'}
                                            style={[styles.statCard, { borderColor: colors.cardBorder }]}
                                        >
                                            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}15` }]}>
                                                <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
                                            </View>
                                            <View style={styles.statInfo}>
                                                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
                                                <Text style={[styles.statLabel, { color: colors.textPrimary }]}>{stat.label}</Text>
                                                <Text style={[styles.statSubtitle, { color: colors.textSecondary }]}>{stat.subtitle}</Text>
                                            </View>
                                        </GlassView>
                                    </Pressable>
                                </Animated.View>

                            ))}
                        </View>

                        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.quickActions}>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    router.push('/promote' as any);
                                }}
                                style={styles.quickActionButton}
                            >
                                <LinearGradient
                                    colors={[colors.pink, colors.purple]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={[styles.quickAction, { borderColor: 'transparent' }]}
                                >
                                    <MaterialCommunityIcons name="bullhorn-outline" size={20} color={colors.white} />
                                    <Text style={[styles.quickActionText, { color: colors.white }]}>{t('provider.dashboard.promote')}</Text>
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(500).duration(800)}>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/provider-analytics');
                                }}
                                style={({ pressed }) => [
                                    styles.analyticsCard,
                                    { borderColor: colors.pink, transform: [{ scale: pressed ? 0.98 : 1 }] }
                                ]}
                            >
                                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                <View style={[styles.analyticsIcon, { backgroundColor: colors.purpleGlow }]}>
                                    <MaterialCommunityIcons name="chart-line" size={22} color={colors.pink} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.analyticsTitle, { color: colors.textPrimary }]}>{t('vendor.dashboard.analytics')}</Text>
                                    <Text style={[styles.analyticsSubtitle, { color: colors.textSecondary }]}>{t('provider.dashboard.analyticsSub')}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.pink} />
                            </Pressable>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(550).duration(800)}>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    router.push('/provider-employees' as any);
                                }}
                                style={({ pressed }) => [
                                    styles.teamCard,
                                    {
                                        borderColor: colors.pink,
                                        transform: [{ scale: pressed ? 0.98 : 1 }],
                                    },
                                ]}
                            >
                                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                                <View style={[styles.teamIconWrap, { backgroundColor: colors.pink + '15' }]}>
                                    <MaterialCommunityIcons name="account-group-outline" size={22} color={colors.pink} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.teamCardTitle, { color: colors.textPrimary }]}>{t('provider.dashboard.manageTeam')}</Text>
                                    <Text style={[styles.teamCardSub, { color: colors.textSecondary }]}>{t('provider.dashboard.teamSub')}</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.pink} />
                            </Pressable>
                        </Animated.View>

                        <Animated.View entering={FadeInUp.delay(600).duration(800)} style={[styles.section, { marginTop: Spacing.lg }]}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('provider.dashboard.todayAppointments')}</Text>
                                <Pressable onPress={() => router.push('/(provider-tabs)/bookings')}>
                                    <Text style={[styles.sectionLink, { color: colors.pink }]}>{t('common.seeAll')}</Text>
                                </Pressable>
                            </View>

                            {dashboard?.todays_appointments.length ? (
                                dashboard.todays_appointments.map((appointment) => (
                                    <Pressable
                                        key={appointment.booking_id}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push(`/provider-booking/${appointment.booking_id}`);
                                        }}
                                        style={({ pressed }) => [
                                            styles.orderCardWrapper,
                                            { transform: [{ scale: pressed ? 0.98 : 1 }] }
                                        ]}
                                    >
                                        <GlassView
                                            intensity={isDark ? 20 : 40}
                                            tint={isDark ? 'dark' : 'light'}
                                            style={[styles.orderCard, { borderColor: colors.cardBorder }]}
                                        >
                                            <View style={styles.orderTopRow}>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.orderCustomer, { color: colors.textPrimary }]}>{appointment.customer_name}</Text>
                                                    <Text style={[styles.orderMeta, { color: colors.textSecondary }]}>{appointment.service_name} · {formatTime(appointment.start_time)}</Text>
                                                </View>
                                                <View style={[styles.statusBadge, { backgroundColor: getStatusTint(appointment.status, colors).bg }]}>
                                                    <Text style={[styles.statusBadgeText, { color: getStatusTint(appointment.status, colors).fg }]}>
                                                        {t(`status.${String(appointment.status || '').toLowerCase().replace(/-/g, '_')}`, { defaultValue: String(appointment.status || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={styles.orderBottomRow}>
                                                <Text style={[styles.orderMeta, { color: colors.textSecondary }]}>{t('provider.dashboard.bookingNumber', { id: appointment.booking_id })}</Text>
                                                <Text style={[styles.orderTotal, { color: colors.textPrimary }]}>{Number(appointment.booking_price).toLocaleString('en-EG')} {currencySuffix}</Text>
                                            </View>
                                        </GlassView>
                                    </Pressable>
                                ))
                            ) : (
                                <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.emptyState, { borderColor: colors.cardBorder }]}>
                                    <MaterialCommunityIcons name="calendar-blank-outline" size={44} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('provider.dashboard.noAppointments')}</Text>
                                </GlassView>
                            )}
                        </Animated.View>

                        {/* Popular Services */}
                        <Animated.View entering={FadeInUp.delay(700).duration(800)} style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('provider.dashboard.popularServices')}</Text>
                                <Pressable onPress={() => router.push('/(provider-tabs)/services')}>
                                    <Text style={[styles.sectionLink, { color: colors.pink }]}>{t('common.manage')}</Text>
                                </Pressable>
                            </View>

                            {dashboard?.popular_services.length ? (
                                dashboard.popular_services.map((service) => (
                                    <Pressable
                                        key={service.service_id}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            router.push(`/provider-service/${service.service_id}`);
                                        }}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] })}
                                    >
                                        <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.productRow, { borderColor: colors.cardBorder }]}>
                                            <View style={[styles.productThumbPlaceholder, { backgroundColor: colors.pink + '20' }]}>
                                                <MaterialCommunityIcons name="wrench" size={18} color={colors.pink} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.productName, { color: colors.textPrimary }]}>{service.name}</Text>
                                                <Text style={[styles.productMeta, { color: colors.textSecondary }]}>{t('provider.dashboard.bookingCount', { count: service.booking_count })}</Text>
                                            </View>
                                            <Text style={[styles.productRevenue, { color: colors.pink }]}>
                                                {Number(service.revenue).toLocaleString('en-EG')} {currencySuffix}
                                            </Text>
                                        </GlassView>
                                    </Pressable>
                                ))
                            ) : (
                                <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.emptyState, { borderColor: colors.cardBorder }]}>
                                    <MaterialCommunityIcons name="wrench-outline" size={44} color={colors.textMuted} />
                                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('provider.dashboard.noServices')}</Text>
                                </GlassView>
                            )}
                        </Animated.View>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    headerLeft: { flex: 1 },
    notificationBtn: {
        width: 52, height: 52, borderRadius: BorderRadius.full,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1,
    },
    notificationBtnSmall: {
        width: 40, height: 40, borderRadius: BorderRadius.full,
        justifyContent: 'center', alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute', top: 16, right: 16,
        width: 8, height: 8, borderRadius: 4,
        borderWidth: 1.5, borderColor: '#050505',
    },
    notificationCircleIndicator: {
        width: 10, height: 10, borderRadius: 999, borderColor: 'white', borderWidth: 1.3, position: "absolute", top: 15, right: 15, zIndex: 10
    },
    greeting: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        opacity: 0.8,
    },
    title: {
        fontFamily: Fonts.extraBold,
        fontSize: 32,
        letterSpacing: -1,
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    statWrapper: {
        width: '48%',
    },
    statCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
        ...Shadows.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statInfo: {
        gap: 2,
    },
    statValue: {
        fontFamily: Fonts.bold,
        fontSize: FontSizes.lg,
    },
    statLabel: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        opacity: 0.8,
    },

    statSubtitle: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.xs,
        marginTop: 2,
        opacity: 0.7,
    },
    quickActions: {
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    quickActionButton: {
        width: '100%',
    },
    quickAction: {
        width: '100%',
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
        flexShrink: 1,
        textAlign: 'center',
    },
    teamCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.sm,
        overflow: 'hidden',
        ...Shadows.md,
    },
    teamIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    teamCardTitle: {
        fontFamily: Fonts.semiBold,
        fontSize: FontSizes.md,
        marginBottom: 2,
    },
    teamCardSub: {
        fontFamily: Fonts.regular,
        fontSize: FontSizes.sm,
    },
    analyticsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
        ...Shadows.md,
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
    orderCardWrapper: {
        marginBottom: Spacing.sm,
    },
    orderCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        overflow: 'hidden',
        ...Shadows.md,
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
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        gap: Spacing.md,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    productThumbPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
        overflow: 'hidden',
    },
    emptyText: {
        fontFamily: Fonts.medium,
        fontSize: FontSizes.md,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
});

