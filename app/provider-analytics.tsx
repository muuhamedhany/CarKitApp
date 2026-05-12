import { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator, Pressable, RefreshControl, ScrollView,
    StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { providerService } from '@/services/api/provider.service';
import {
    ProviderAnalyticsRange,
    ProviderAnalyticsResponse,
    ProviderAnalyticsTrendPoint,
} from '@/types/api.types';
import { BorderRadius, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GlassView } from '@/components';

const RANGE_OPTIONS: Array<{ label: string; value: ProviderAnalyticsRange }> = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' },
];

const formatCurrency = (value: number) => Number(value || 0).toLocaleString('en-EG');
const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
const getChangeColor = (value: number, colors: any) =>
    value > 0 ? '#10B981' : value < 0 ? '#EF4444' : colors.textSecondary;

function buildLineChart(points: ProviderAnalyticsTrendPoint[], width: number, height: number, padding: number) {
    if (!points.length) return { linePath: '', areaPath: '' };
    const values = points.map(p => p.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    const innerW = Math.max(1, width - padding * 2);
    const innerH = Math.max(1, height - padding * 2);
    const stepX = points.length === 1 ? 0 : innerW / (points.length - 1);

    const getX = (i: number) => padding + stepX * i;
    const getY = (v: number) => height - padding - ((v - minValue) / range) * innerH;

    let linePath = `M ${getX(0)} ${getY(values[0])}`;
    for (let i = 1; i < values.length; i++) {
        linePath += ` L ${getX(i)} ${getY(values[i])}`;
    }
    const areaPath = `${linePath} L ${getX(values.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

    return { linePath, areaPath };
}

export default function ProviderAnalyticsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();
    const { showToast } = useToast();
    const { width: screenW } = useWindowDimensions();

    const [range, setRange] = useState<ProviderAnalyticsRange>('monthly');
    const [analytics, setAnalytics] = useState<ProviderAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isDark = colors.background === '#000000' || colors.background === '#121212';

    const load = useCallback(async (r: ProviderAnalyticsRange) => {
        try {
            setLoading(true);
            const res = await providerService.getAnalytics(r);
            if (res.success && res.data) setAnalytics(res.data);
        } catch (err: any) {
            showToast('error', 'Error', err?.message || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useFocusEffect(useCallback(() => { load(range); }, [load, range]));

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await load(range);
        setRefreshing(false);
    }, [load, range]);

    const chartW = screenW - Spacing.md * 2 - 32;
    const chartH = 180;
    const chartPad = 16;

    const { linePath, areaPath } = useMemo(() => {
        if (!analytics?.trend?.points) return { linePath: '', areaPath: '' };
        return buildLineChart(analytics.trend.points, chartW, chartH, chartPad);
    }, [analytics?.trend?.points, chartW]);

    const summaryCards = analytics ? [
        {
            label: 'Revenue',
            value: `${formatCurrency(analytics.revenue.total)} EGP`,
            change: analytics.revenue.change_pct,
            icon: 'cash-multiple',
            color: colors.pink,
        },
        {
            label: 'Bookings',
            value: String(analytics.bookings.total),
            change: analytics.bookings.change_pct,
            icon: 'calendar-check',
            color: '#818CF8',
        },
        {
            label: 'New Customers',
            value: String(analytics.new_customers.total),
            change: analytics.new_customers.change_pct,
            icon: 'account-plus',
            color: '#10B981',
        },
    ] : [];

    const maxSvcRevenue = analytics?.service_revenue?.length
        ? Math.max(...analytics.service_revenue.map(s => s.revenue), 1)
        : 1;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={[colors.bgGradientStart, colors.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Orbs */}
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

            {/* Header */}
            <View style={[styles.headerRow, { paddingTop: insets.top + Spacing.sm }]}>
                <Pressable
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.back();
                    }}
                    style={[styles.backButton, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
                >
                    <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textPrimary} />
                </Pressable>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>
            </View>

            {/* Range selector */}
            <Animated.View entering={FadeInDown.delay(100).duration(800)} style={[styles.rangeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: colors.cardBorder }]}>
                {RANGE_OPTIONS.map(opt => (
                    <Pressable
                        key={opt.value}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setRange(opt.value);
                        }}
                        style={[
                            styles.rangePill,
                            { backgroundColor: range === opt.value ? colors.purple : 'transparent' },
                        ]}
                    >
                        <Text style={[
                            styles.rangeLabel,
                            { color: range === opt.value ? '#E9DEF8' : colors.textSecondary },
                        ]}>{opt.label}</Text>
                    </Pressable>
                ))}
            </Animated.View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.pink} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Summary Cards */}
                    <View style={styles.cardsRow}>
                        {summaryCards.map((card, index) => (
                            <Animated.View 
                                key={card.label} 
                                entering={FadeInDown.delay(200 + index * 100).duration(800)}
                                style={{ flex: 1 }}
                            >
                                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.summaryCard, { borderColor: colors.cardBorder }]}>
                                    <MaterialCommunityIcons name={card.icon as any} size={22} color={card.color} />
                                    <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{card.value}</Text>
                                    <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{card.label}</Text>
                                    <Text style={[styles.cardChange, { color: getChangeColor(card.change, colors) }]}>
                                        {formatPercent(card.change)}
                                    </Text>
                                </GlassView>
                            </Animated.View>
                        ))}
                    </View>

                    {/* Revenue Trend Chart */}
                    {analytics?.trend?.points?.length ? (
                        <Animated.View entering={FadeInDown.delay(500).duration(800)}>
                            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.chartCard, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                                    Revenue Trend
                                </Text>
                                <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
                                    {analytics.trend.subtitle}
                                </Text>
                                <Svg width={chartW} height={chartH}>
                                    <Defs>
                                        <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                            <Stop offset="0" stopColor={colors.pink} stopOpacity="0.3" />
                                            <Stop offset="1" stopColor={colors.pink} stopOpacity="0" />
                                        </SvgGradient>
                                    </Defs>
                                    {areaPath ? (
                                        <Path d={areaPath} fill="url(#areaGrad)" />
                                    ) : null}
                                    {linePath ? (
                                        <Path d={linePath} stroke={colors.pink} strokeWidth={2} fill="none" />
                                    ) : null}
                                </Svg>
                                <View style={styles.chartXLabels}>
                                    {analytics.trend.points.map((p, i) => (
                                        <Text key={i} style={[styles.chartLabel, { color: colors.textSecondary }]}>
                                            {p.label}
                                        </Text>
                                    ))}
                                </View>
                            </GlassView>
                        </Animated.View>
                    ) : null}

                    {/* Customer Mix */}
                    {analytics?.customer_mix && (
                        <Animated.View entering={FadeInDown.delay(600).duration(800)}>
                            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.mixCard, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Customer Mix</Text>
                                <View style={styles.mixRow}>
                                    {[
                                        { label: 'Total', value: analytics.customer_mix.total, color: colors.pink },
                                        { label: 'Returning', value: analytics.customer_mix.returning, color: '#818CF8' },
                                        { label: 'New', value: analytics.customer_mix.new, color: '#10B981' },
                                    ].map(item => (
                                        <View key={item.label} style={styles.mixItem}>
                                            <View style={[styles.mixDot, { backgroundColor: item.color }]} />
                                            <Text style={[styles.mixValue, { color: colors.textPrimary }]}>{item.value}</Text>
                                            <Text style={[styles.mixLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                                        </View>
                                    ))}
                                </View>
                            </GlassView>
                        </Animated.View>
                    )}

                    {/* Service Revenue breakdown */}
                    {analytics?.service_revenue?.length ? (
                        <Animated.View entering={FadeInUp.delay(700).duration(800)}>
                            <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.breakdownCard, { borderColor: colors.cardBorder }]}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Revenue by Service</Text>
                                {analytics.service_revenue.map((svc, i) => {
                                    const pct = (svc.revenue / maxSvcRevenue) * 100;
                                    return (
                                        <View key={i} style={styles.svcItem}>
                                            <View style={styles.svcTopRow}>
                                                <Text style={[styles.svcName, { color: colors.textPrimary }]} numberOfLines={1}>
                                                    {svc.name}
                                                </Text>
                                                <Text style={[styles.svcRevenue, { color: colors.pink }]}>
                                                    {formatCurrency(svc.revenue)} EGP
                                                </Text>
                                            </View>
                                            <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: colors.pink }]} />
                                            </View>
                                        </View>
                                    );
                                })}
                            </GlassView>
                        </Animated.View>
                    ) : null}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    orb: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontFamily: Fonts.extraBold, fontSize: 28, letterSpacing: -0.5 },
    rangeToggle: {
        flexDirection: 'row',
        marginHorizontal: Spacing.md,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        padding: 4,
        marginBottom: Spacing.lg,
    },
    rangePill: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
    },
    rangeLabel: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: 100 },
    cardsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
    summaryCard: {
        flex: 1, borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.sm, alignItems: 'center', gap: 4,
        overflow: 'hidden',
        ...Shadows.sm,
    },
    cardValue: { fontFamily: Fonts.bold, fontSize: FontSizes.md, textAlign: 'center' },
    cardLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, textAlign: 'center' },
    cardChange: { fontFamily: Fonts.semiBold, fontSize: FontSizes.xs },
    chartCard: {
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.md, marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.md,
    },
    sectionTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, marginBottom: 2 },
    sectionSub: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginBottom: Spacing.md },
    chartXLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    chartLabel: { fontFamily: Fonts.regular, fontSize: 9 },
    mixCard: {
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.md, marginBottom: Spacing.md,
        overflow: 'hidden',
        ...Shadows.md,
    },
    mixRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: Spacing.md },
    mixItem: { alignItems: 'center', gap: 4 },
    mixDot: { width: 12, height: 12, borderRadius: 6 },
    mixValue: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
    mixLabel: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },
    breakdownCard: {
        borderRadius: BorderRadius.xl, borderWidth: 1,
        padding: Spacing.md, marginBottom: Spacing.md, gap: Spacing.sm,
        overflow: 'hidden',
        ...Shadows.md,
    },
    svcItem: { marginTop: Spacing.xs },
    svcTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    svcName: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, flex: 1 },
    svcRevenue: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },
    barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 3 },
});

