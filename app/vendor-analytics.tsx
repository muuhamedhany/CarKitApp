import {
  useCallback,
  useMemo,
  useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';

import { useToast } from '@/contexts/ToastContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { vendorService } from '@/services/api/vendor.service';
import {
  VendorAnalyticsCategory,
  VendorAnalyticsRange,
  VendorAnalyticsResponse,
  VendorAnalyticsTrendPoint,
} from '@/types/api.types';
import { BorderRadius, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import { GlassView, AnalyticsSkeleton, CountUp } from '@/components';
import Text from '@/components/common/LocalizedText';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const RANGE_OPTIONS: Array<{ label: string; value: VendorAnalyticsRange }> = [
  { label: 'analytics.weekly', value: 'weekly' },
  { label: 'analytics.monthly', value: 'monthly' },
  { label: 'analytics.yearly', value: 'yearly' },
];

const formatCurrency = (value: number) => Number(value || 0).toLocaleString('en-EG');
const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const getChangeColor = (value: number, colors: any) => {
  if (value > 0) return colors.success;
  if (value < 0) return colors.error;
  return colors.textSecondary;
};

const buildLineChart = (
  points: VendorAnalyticsTrendPoint[],
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
  const smoothing = 0.2;

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

const buildCategorySeries = (categories: VendorAnalyticsCategory[]) => {
  const sorted = [...categories].sort((a, b) => b.revenue - a.revenue);
  const primary = sorted.slice(0, 3);
  if (sorted.length <= 3) {
    return primary;
  }
  const remainder = sorted.slice(3).reduce(
    (acc, item) => {
      acc.revenue += item.revenue;
      acc.percentage += item.percentage;
      return acc;
    },
    { category_id: null, name: 'Other', revenue: 0, percentage: 0 }
  );
  return [...primary, remainder];
};

export default function VendorAnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const currencySuffix = t('common.currency.egp');
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();


  const [range, setRange] = useState<VendorAnalyticsRange>('monthly');
  const [analytics, setAnalytics] = useState<VendorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const chartProgress = useSharedValue(0);



  const chartWidth = Math.max(240, width - Spacing.md * 2 - 32);
  const chartHeight = 160;

  const loadAnalytics = useCallback(
    async (nextRange: VendorAnalyticsRange) => {
      try {
        setLoading(true);
        const res = await vendorService.getAnalytics(nextRange);
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (error: any) {
        showToast('error', t('common.error'), error?.message || t('analytics.loadFailed'));
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

  const categorySeries = useMemo(
    () => buildCategorySeries(analytics?.categories ?? []),
    [analytics?.categories]
  );

  const donutSize = 120;
  const donutRadius = 44;
  const donutStroke = 12;
  const circumference = 2 * Math.PI * donutRadius;
  let donutOffset = 0;

  const categoryColors = [colors.pink, colors.purple, colors.purpleLight, colors.pinkLight];
  const primaryCategory = categorySeries[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <ExpoLinearGradient
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
            progressBackgroundColor={isDark ? colors.backgroundSecondary : '#FFFFFF'}
          />
        }
      >


        {isDark && (
          <>
            <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
            <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />
          </>
        )}

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('analytics.title')}</Text>
        </View>

        <View style={[styles.rangeToggle, { backgroundColor: colors.surfaceMuted, borderColor: colors.cardBorder }]}
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
                    { color: isActive ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {t(option.label)}
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
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t('analytics.noData')}</Text>
          </View>
        ) : (
          <>
            <View>
              <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.revenueCard, { borderColor: colors.purpleDark, backgroundColor: colors.purple + '20' }]}>
                <Pressable
                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                  onPress={() => Alert.alert(t('analytics.revenue'), t('analytics.revenueInfoOrders'))}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
                </Pressable>
                <View>
                  <Text style={[styles.revenueLabel, { color: colors.textSecondary }]}>{t('analytics.revenue')}</Text>
                  <CountUp
                    value={analytics.revenue.total}
                    style={[styles.revenueValue, { color: colors.textPrimary }]}
                    formatter={(val) => {
                      'worklet';
                      return `${Math.floor(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${currencySuffix}`;
                    }}
                  />
                </View>
                <View style={[styles.changePill, { backgroundColor: colors.purpleDark }]}>
                  <MaterialCommunityIcons
                    name={analytics.revenue.change_pct >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                  color={'#FFFFFF'}
                  />
                  <Text selectable style={[styles.changeText, { color: '#FFFFFF' }]}>
                    {formatPercent(analytics.revenue.change_pct)}
                  </Text>
                </View>
              </GlassView>
            </View>

            <View style={styles.statGrid}>
              <View style={{ flex: 1 }}>
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statCard, { borderColor: colors.cardBorder }]}>
                  <Pressable
                    style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                    onPress={() => Alert.alert(t('analytics.orders'), t('analytics.ordersInfo'))}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                  <MaterialCommunityIcons name="receipt-text" size={20} color={colors.pink} />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('analytics.orders')}</Text>
                  <CountUp
                    value={analytics.orders.total}
                    style={[styles.statValue, { color: colors.textPrimary }]}
                  />
                  <Text
                    selectable
                    style={[styles.statDelta, { color: getChangeColor(analytics.orders.change_pct, colors) }]}
                  >
                    {formatPercent(analytics.orders.change_pct)}
                  </Text>
                </GlassView>
              </View>

              <View style={{ flex: 1 }}>
                <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.statCard, { borderColor: colors.cardBorder }]}>
                  <Pressable
                    style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}
                    onPress={() => Alert.alert(t('analytics.avgOrderValue'), t('analytics.avgOrderValueInfo'))}
                    hitSlop={8}
                  >
                    <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
                  </Pressable>
                  <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.pink} />
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t('analytics.avgOrderValue')}</Text>
                  <CountUp
                    value={analytics.order_value.total}
                    style={[styles.statValue, { color: colors.textPrimary }]}
                    formatter={(val) => {
                      'worklet';
                      return Math.floor(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    }}
                  />
                  <Text
                    selectable
                    style={[styles.statDelta, { color: getChangeColor(analytics.order_value.change_pct, colors) }]}
                  >
                    {formatPercent(analytics.order_value.change_pct)}
                  </Text>
                </GlassView>
              </View>
            </View>

            <View>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: colors.cardBorder }]}>

                <Pressable
                  style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}
                  onPress={() => Alert.alert(t('analytics.salesTrend'), t('analytics.trendInfo'))}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
                </Pressable>

                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('analytics.salesTrend')}</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{analytics.trend.subtitle || t('analytics.last30Days')}</Text>
                  </View>
                  <View style={[styles.cardSummary, { marginRight: 20 }]}>
                    <CountUp
                      value={analytics.trend.summary_value}
                      style={[styles.cardSummaryValue, { color: colors.textPrimary }]}
                      formatter={(val) => {
                        'worklet';
                        return `${Math.floor(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
                      }}
                    />
                    <Text style={[styles.cardSummaryLabel, { color: colors.pink }]}>{analytics.trend.summary_label === 'This Week' ? t('analytics.thisWeek') : analytics.trend.summary_label}</Text>
                  </View>


                </View>

                <Svg width={chartWidth} height={chartHeight}>
                  <Defs>
                    <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={colors.pink} stopOpacity={0.35} />
                      <Stop offset="100%" stopColor={colors.pink} stopOpacity={0.05} />
                    </LinearGradient>
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
                  {trendPoints.map((point) => (
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
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('analytics.salesByCategory')}</Text>
                  <Pressable
                    onPress={() => Alert.alert(t('analytics.salesByCategory'), t('analytics.salesByCategoryInfo'))}
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
                      {categorySeries.map((segment, index) => {
                        const dash = (segment.percentage / 100) * circumference;
                        const strokeDasharray = `${dash} ${circumference - dash}`;
                        const strokeDashoffset = -donutOffset;
                        donutOffset += dash;

                        return (
                          <Circle
                            key={segment.name}
                            cx={donutSize / 2}
                            cy={donutSize / 2}
                            r={donutRadius}
                            stroke={categoryColors[index % categoryColors.length]}
                            strokeWidth={donutStroke}
                            strokeDasharray={strokeDasharray}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="none"
                            transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                          />
                        );
                      })}
                    </Svg>
                    <View style={styles.donutCenter}>
                      <Text selectable style={[styles.donutValue, { color: colors.textPrimary }]}>
                        {primaryCategory ? `${Math.round(primaryCategory.percentage)}%` : '0%'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryLegend}>
                    {categorySeries.map((segment, index) => (
                      <View key={segment.name} style={styles.categoryItem}>
                        <View
                          style={[
                            styles.categoryDot,
                            { backgroundColor: categoryColors[index % categoryColors.length] },
                          ]}
                        />
                        <Text style={[styles.categoryName, { color: colors.textSecondary }]}>{segment.name}</Text>
                        <Text style={[styles.categoryValue, { color: colors.textPrimary }]}>
                          {Math.round(segment.percentage)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </GlassView>
            </View>

            <View>
              <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.card, { borderColor: colors.cardBorder }]}>
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('analytics.topProducts')}</Text>
                    <Pressable
                      onPress={() => Alert.alert(t('analytics.topProducts'), t('analytics.topProductsInfo'))}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push('/(vendor-tabs)/products');
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.cardLink, { color: colors.pink }]}>{t('common.manage')}</Text>
                  </Pressable>
                </View>
                {analytics.top_products.length ? (
                  analytics.top_products.map((product) => (
                    <View key={product.product_id} style={[styles.productRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                      <View style={styles.productInfo}>
                        <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
                        <Text style={[styles.productMeta, { color: colors.textSecondary }]}>
                          {t('analytics.soldUnits', { count: product.sold_units })}
                        </Text>
                      </View>
                      <View style={styles.productStats}>
                        <Text style={[styles.productRevenue, { color: colors.textPrimary }]}
                          selectable
                        >
                          {formatCurrency(product.revenue)} {currencySuffix}
                        </Text>
                        <Text
                          selectable
                          style={[styles.productDelta, { color: getChangeColor(product.change_pct, colors) }]}
                        >
                          {formatPercent(product.change_pct)}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('analytics.noProducts')}</Text>
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
    ...Shadows.md,
  },
  revenueLabel: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  revenueValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
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
    fontFamily: Fonts.bold,
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
    fontSize: FontSizes.xs,
  },
  cardSummary: {
    alignItems: 'flex-end',
  },
  cardSummaryValue: {
    width: 60,
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
    fontFamily: Fonts.bold,
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
});

