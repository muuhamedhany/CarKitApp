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
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { vendorService } from '@/services/api/vendor.service';
import {
  VendorAnalyticsCategory,
  VendorAnalyticsRange,
  VendorAnalyticsResponse,
  VendorAnalyticsTrendPoint,
} from '@/types/api.types';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';

const RANGE_OPTIONS: Array<{ label: string; value: VendorAnalyticsRange }> = [
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
  for (let i = 1; i < values.length; i += 1) {
    linePath += ` L ${getX(i)} ${getY(values[i])}`;
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
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [range, setRange] = useState<VendorAnalyticsRange>('monthly');
  const [analytics, setAnalytics] = useState<VendorAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        showToast('error', 'Error', error?.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.pink}
            colors={[colors.pink]}
          />
        }
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backButton, { borderColor: colors.cardBorder, backgroundColor: colors.backgroundSecondary }]}
          >
            <MaterialCommunityIcons name="chevron-left" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>
        </View>

        <View style={[styles.rangeToggle, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
        >
          {RANGE_OPTIONS.map((option) => {
            const isActive = option.value === range;
            return (
              <Pressable
                key={option.value}
                onPress={() => setRange(option.value)}
                style={[
                  styles.rangePill,
                  { backgroundColor: isActive ? colors.purple : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.rangeLabel,
                    { color: isActive ? '#E9DEF8' : colors.textMuted },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.pink} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading analytics...</Text>
          </View>
        ) : !analytics ? (
          <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="chart-line" size={32} color={colors.textMuted} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>No analytics data yet.</Text>
          </View>
        ) : (
          <>
            <View style={[styles.revenueCard, { backgroundColor: colors.purple, borderColor: colors.purpleDark }]}>
              <View>
                <Text style={[styles.revenueLabel, { color: '#E9DEF8' }]}>Revenue</Text>
                <Text
                  selectable
                  style={[styles.revenueValue, { color: '#E9DEF8', fontVariant: ['tabular-nums'] }]}
                >
                  {formatCurrency(analytics.revenue.total)} EGP
                </Text>
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
            </View>

            <View style={styles.statGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="receipt-text" size={20} color={colors.pink} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>total Orders</Text>
                <Text
                  selectable
                  style={[styles.statValue, { color: colors.textPrimary, fontVariant: ['tabular-nums'] }]}
                >
                  {analytics.orders.total}
                </Text>
                <Text
                  selectable
                  style={[styles.statDelta, { color: getChangeColor(analytics.orders.change_pct, colors) }]}
                >
                  {formatPercent(analytics.orders.change_pct)}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.pink} />
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Avg Order Value</Text>
                <Text
                  selectable
                  style={[styles.statValue, { color: colors.textPrimary, fontVariant: ['tabular-nums'] }]}
                >
                  {formatCurrency(analytics.order_value.total)}
                </Text>
                <Text
                  selectable
                  style={[styles.statDelta, { color: getChangeColor(analytics.order_value.change_pct, colors) }]}
                >
                  {formatPercent(analytics.order_value.change_pct)}
                </Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{analytics.trend.title}</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>{analytics.trend.subtitle}</Text>
                </View>
                <View style={styles.cardSummary}>
                  <Text style={[styles.cardSummaryValue, { color: colors.textPrimary }]}>
                    {formatCurrency(analytics.trend.summary_value)} EGP
                  </Text>
                  <Text style={[styles.cardSummaryLabel, { color: colors.pink }]}>{analytics.trend.summary_label}</Text>
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
                  <Path d={lineChart.linePath} stroke={colors.pink} strokeWidth={3} fill="none" />
                ) : null}
              </Svg>

              <View style={styles.trendLabels}>
                {trendPoints.map((point) => (
                  <Text key={point.label} style={[styles.trendLabel, { color: colors.textMuted }]}>
                    {point.label}
                  </Text>
                ))}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Sales by Category</Text>
              <View style={styles.categoryRow}>
                <View style={styles.donutWrap}>
                  <Svg width={donutSize} height={donutSize}>
                    <Circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={donutRadius}
                      stroke={colors.cardBorder}
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
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Top Products</Text>
                <Text style={[styles.cardLink, { color: colors.pink }]}>Manage</Text>
              </View>
              {analytics.top_products.length ? (
                analytics.top_products.map((product) => (
                  <View key={product.product_id} style={[styles.productRow, { borderBottomColor: colors.cardBorder }]}>
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
                      <Text style={[styles.productMeta, { color: colors.textMuted }]}>
                        {product.sold_units} sold
                      </Text>
                    </View>
                    <View style={styles.productStats}>
                      <Text style={[styles.productRevenue, { color: colors.textPrimary }]}
                        selectable
                      >
                        {formatCurrency(product.revenue)} EGP
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
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products yet.</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
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
});
