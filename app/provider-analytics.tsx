import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Alert,
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
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { GlassView, AnalyticsSkeleton, CountUp } from '@/components';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const RANGE_OPTIONS: Array<{ label: string; value: ProviderAnalyticsRange }> = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const formatCurrency = (value: number) => Number(value || 0).toLocaleString('en-EG');
const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const getChangeColor = (value: number, colors: any) => {
  if (value > 0) return colors.success;
  if (value < 0) return colors.error;
  return colors.textSecondary;
};

const buildLineChart = (
  points: ProviderAnalyticsTrendPoint[],
  width: number,
  height: number,
  padding: number
) => {
  if (!points.length) {
    return { linePath: '', areaPath: '' };
  }

  const values = points.map((point) => point.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  const innerWidth = Math.max(1, width - padding * 2);
  const innerHeight = Math.max(1, height - padding * 2);
  const stepX = points.length === 1 ? 0 : innerWidth / (points.length - 1);

  const getX = (index: number) => padding + stepX * index;
  const getY = (value: number) =>
    height - padding - ((value - minValue) / range) * innerHeight;

  let linePath = `M ${getX(0)} ${getY(values[0])}`;
  
  // Smooth curves using cubic Bezier
  const smoothing = 0.3;

  for (let i = 1; i < values.length; i += 1) {
    const x = getX(i);
    const y = getY(values[i]);
    const prevX = getX(i - 1);
    const prevY = getY(values[i - 1]);
    
    // Control points for a natural looking curve that respects data points
    const cp1x = prevX + (x - prevX) * smoothing;
    const cp1y = prevY;
    const cp2x = x - (x - prevX) * smoothing;
    const cp2y = y;
    
    linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
  }

  const areaPath = `${linePath} L ${getX(values.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return { linePath, areaPath };
};

export default function ProviderAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();


  const [range, setRange] = useState<ProviderAnalyticsRange>('monthly');
  const [analytics, setAnalytics] = useState<ProviderAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chartWidth = Math.max(240, width - Spacing.md * 2 - 32);
  const chartHeight = 160;

  const chartProgress = useSharedValue(0);

  const loadAnalytics = useCallback(
    async (nextRange: ProviderAnalyticsRange) => {
      try {
        setLoading(true);
        const res = await providerService.getAnalytics(nextRange);
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (error: any) {
        showToast('error', 'Error', error?.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
        chartProgress.value = 0;
        chartProgress.value = withTiming(1, { 
          duration: 3000,
          easing: Easing.inOut(Easing.quad)
        });
      }
    },
    [showToast]
  );

  useFocusEffect(
    useCallback(() => {
      loadAnalytics(range);
    }, [loadAnalytics, range])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics(range);
    setRefreshing(false);
  }, [loadAnalytics, range]);

  const trendPoints = analytics?.trend.points ?? [];
  const lineChart = useMemo(
    () => buildLineChart(trendPoints, chartWidth, chartHeight, 12),
    [trendPoints, chartWidth]
  );

  const animatedPathProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - chartProgress.value) * 1000,
  }));

  const mixTotal = analytics?.customer_mix?.total || 1;
  const returningPct = ((analytics?.customer_mix?.returning || 0) / mixTotal) * 100;
  const newPct = ((analytics?.customer_mix?.new || 0) / mixTotal) * 100;

  const donutSize = 120;
  const donutRadius = 44;
  const donutStroke = 12;
  const circumference = 2 * Math.PI * donutRadius;
  const returningDash = (returningPct / 100) * circumference;
  const newDash = (newPct / 100) * circumference;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.pink}
            colors={[colors.pink]}
          />
        }
      >
        {/* Decorative Orbs */}
        <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
        <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

        <View style={[styles.headerRow]}>
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

        <View style={[styles.rangeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: colors.cardBorder }]}
        >
          {RANGE_OPTIONS.map((option) => {
            const isActive = option.value === range;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRange(option.value);
                }}
                style={[
                  styles.rangePill,
                  { backgroundColor: isActive ? colors.purple : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.rangeLabel,
                    { color: isActive ? '#E9DEF8' : colors.textSecondary },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <AnalyticsSkeleton />
        ) : !analytics ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="chart-line" size={32} color={colors.textMuted} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>No analytics data yet.</Text>
          </View>
        ) : (
          <>
            <View>
              <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.revenueCard, { borderColor: colors.purpleDark, backgroundColor: colors.purple + '20' }]}>
                <Pressable
                  style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
                  onPress={() => Alert.alert('Revenue', 'Total revenue generated from all completed bookings in the selected period. The percentage change is compared to the previous period.')}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="information-outline" size={18} color="rgba(255,255,255,0.7)" />
                </Pressable>
                <View style={{ flex: 1, marginRight: Spacing.md }}>
                  <Text style={[styles.revenueLabel, { color: '#E9DEF8' }]}>Revenue</Text>
                    <CountUp
                      value={analytics.revenue.total}
                      style={[styles.revenueValue, { color: '#E9DEF8' }]}
                      formatter={(val) => {
                        'worklet';
                        return `${Math.floor(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} EGP`;
                      }}
                    />
                </View>
                <View style={[styles.changePill, { backgroundColor: colors.purpleDark }]}>
                  <MaterialCommunityIcons
                    name={analytics.revenue.change_pct >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={'#E9DEF8'}
                  />
                  <Text selectable style={[styles.changeText, { color: '#E9DEF8' }]}>
                    {formatPercent(analytics.revenue.change_pct)}
                  </Text>
                </View>
              </GlassView>
            </View>

            <View style={styles.statGrid}>
              <View style={{ flex: 1 }}>
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statCard, { borderColor: colors.cardBorder }]}>
                  <Pressable
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
                    onPress={() => Alert.alert('Bookings', 'Total number of bookings made in the selected period. The percentage change is compared to the previous period.')}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={colors.pink} />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bookings</Text>
                    <CountUp
                      value={analytics.bookings.total}
                      style={[styles.statValue, { color: colors.textPrimary }]}
                    />
                  <Text
                    selectable
                    style={[styles.statDelta, { color: getChangeColor(analytics.bookings.change_pct, colors) }]}
                  >
                    {formatPercent(analytics.bookings.change_pct)}
                  </Text>
                </GlassView>
              </View>

              <View style={{ flex: 1 }}>
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statCard, { borderColor: colors.cardBorder }]}>
                  <Pressable
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
                    onPress={() => Alert.alert('New Customers', 'Number of unique new customers who made their first booking in the selected period. The percentage change is compared to the previous period.')}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                  <MaterialCommunityIcons name="account-group-outline" size={20} color={colors.pink} />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New Customers</Text>
                    <CountUp
                      value={analytics.new_customers.total}
                      style={[styles.statValue, { color: colors.textPrimary }]}
                    />
                  <Text
                    selectable
                    style={[styles.statDelta, { color: getChangeColor(analytics.new_customers.change_pct, colors) }]}
                  >
                    {formatPercent(analytics.new_customers.change_pct)}
                  </Text>
                </GlassView>
              </View>
            </View>

            <View>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: colors.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Booking Volume</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{analytics.trend.subtitle || "Last 30 days performance"}</Text>
                  </View>
                  <Pressable
                    onPress={() => Alert.alert('Booking Volume', 'A visual trend of booking volume over the selected period.')}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <Svg width={chartWidth} height={chartHeight}>
                  <Defs>
                    <SvgGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={colors.pink} stopOpacity={0.35} />
                      <Stop offset="100%" stopColor={colors.pink} stopOpacity={0.05} />
                    </SvgGradient>
                  </Defs>
                  {lineChart.areaPath ? (
                    <Path d={lineChart.areaPath} fill="url(#trendFill)" />
                  ) : null}
                  {lineChart.linePath ? (
                    <AnimatedPath
                      d={lineChart.linePath}
                      stroke={colors.pink}
                      strokeWidth={3}
                      fill="none"
                      strokeDasharray={1000}
                      animatedProps={animatedPathProps}
                    />
                  ) : null}
                </Svg>

                <View style={styles.trendLabels}>
                  {analytics.trend.points.map((point) => (
                    <Text key={point.label} style={[styles.trendLabel, { color: colors.textSecondary }]}>
                      {point.label}
                    </Text>
                  ))}
                </View>
              </GlassView>
            </View>

            <View>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: colors.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Customer Mix</Text>
                  <Pressable
                    onPress={() => Alert.alert('Customer Mix', 'Percentage of returning customers vs new customers based on bookings in the selected period.')}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
                <View style={styles.categoryRow}>
                  <View style={styles.donutWrap}>
                    <Svg width={donutSize} height={donutSize}>
                      <Circle
                        cx={donutSize / 2}
                        cy={donutSize / 2}
                        r={donutRadius}
                        stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                        strokeWidth={donutStroke}
                        fill="none"
                      />
                      <Circle
                        cx={donutSize / 2}
                        cy={donutSize / 2}
                        r={donutRadius}
                        stroke={colors.pink}
                        strokeWidth={donutStroke}
                        strokeDasharray={`${returningDash} ${circumference - returningDash}`}
                        strokeDashoffset={0}
                        strokeLinecap="round"
                        fill="none"
                        transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                      />
                      <Circle
                        cx={donutSize / 2}
                        cy={donutSize / 2}
                        r={donutRadius}
                        stroke={colors.purple}
                        strokeWidth={donutStroke}
                        strokeDasharray={`${newDash} ${circumference - newDash}`}
                        strokeDashoffset={-returningDash}
                        strokeLinecap="round"
                        fill="none"
                        transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                      />
                    </Svg>
                    <View style={styles.donutCenter}>
                      <Text selectable style={[styles.donutValue, { color: colors.textPrimary }]}>
                        {Math.round(returningPct)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryLegend}>
                    <View style={styles.categoryItem}>
                      <View style={[styles.categoryDot, { backgroundColor: colors.pink }]} />
                      <Text style={[styles.categoryName, { color: colors.textSecondary }]}>Returning</Text>
                      <Text style={[styles.categoryValue, { color: colors.textPrimary }]}>{Math.round(returningPct)}%</Text>
                    </View>
                    <View style={styles.categoryItem}>
                      <View style={[styles.categoryDot, { backgroundColor: colors.purple }]} />
                      <Text style={[styles.categoryName, { color: colors.textSecondary }]}>New</Text>
                      <Text style={[styles.categoryValue, { color: colors.textPrimary }]}>{Math.round(newPct)}%</Text>
                    </View>
                  </View>
                </View>
              </GlassView>
            </View>

            <View>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: colors.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Revenue by Service</Text>
                  <Pressable
                    onPress={() => Alert.alert('Revenue by Service', 'Revenue breakdown across different services. The progress bar shows the proportion relative to the highest-earning service.')}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
                {analytics.service_revenue && analytics.service_revenue.length ? (
                  analytics.service_revenue.map((svc) => {
                    const maxRev = Math.max(...analytics.service_revenue.map(s => s.revenue), 1);
                    const pct = (svc.revenue / maxRev) * 100;
                    return (
                      <View key={svc.name} style={styles.serviceItem}>
                        <View style={styles.serviceHeader}>
                          <Text style={[styles.serviceName, { color: colors.textPrimary }]}>{svc.name}</Text>
                          <Text style={[styles.serviceRevenue, { color: colors.textPrimary }]} selectable>
                            {formatCurrency(svc.revenue)} EGP
                          </Text>
                        </View>
                        <View style={[styles.progressBarBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                          <View style={[styles.progressBarFill, { backgroundColor: colors.pink, width: `${pct}%` }]} />
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No services yet.</Text>
                )}
              </GlassView>
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

  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 28,
    letterSpacing: -0.5,
  },
  rangeToggle: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  rangeLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  loadingCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  revenueCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  revenueLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  revenueValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  changeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  statGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 6,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  statLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  statDelta: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  cardSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  cardSummary: {
    alignItems: 'flex-end',
  },
  cardSummaryValue: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  cardSummaryLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  trendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  trendLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  donutWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  categoryLegend: {
    flex: 1,
    gap: Spacing.sm,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  categoryValue: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  cardLink: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  productMeta: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
  },
  productStats: {
    alignItems: 'flex-end',
  },
  productRevenue: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  productDelta: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  // Unique to Provider Analytics
  serviceItem: {
    marginBottom: Spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  serviceName: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  serviceRevenue: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});


