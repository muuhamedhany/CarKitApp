import {
  CenteredHeader,
  GlassView } from '@/components';
import { SkeletonBone } from '@/components/common/SkeletonPlaceholder';
import { BorderRadius,
  FontSizes,
  Fonts,
  Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { bookingService } from '@/services/api/booking.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition
} from 'react-native-reanimated';
import Text from '@/components/common/LocalizedText';
const TypedFlashList = FlashList as any;

const { width } = Dimensions.get('window');

type Booking = {
  booking_id: number;
  service_name: string;
  provider_name?: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  booking_price: string | number;
  location?: string;
  status: string;
};

type TabType = 'upcoming' | 'completed';

const STATUS_COLORS: Record<string, string> = {
  pending: '#FFB74D',
  confirmed: '#64B5F6',
  completed: '#81C784',
  cancelled: '#EF5350',
  'in-progress': '#AB47BC',
};

export default function MyBookingsScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [tab, setTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!token) return;

    if (pageNum === 1 && !isRefresh) setLoading(true);
    if (pageNum > 1) setLoadingMore(true);

    try {
      const statusParam = tab === 'upcoming' ? 'upcoming' : 'completed_all';
      const response = await bookingService.getMyBookings(statusParam, pageNum, 10);
      if (response.success) {
        const newBookings = response.data || [];
        setBookings(prev => pageNum === 1 ? newBookings : [...prev, ...newBookings]);

        if (response.pagination) {
          setHasMore(pageNum < response.pagination.totalPages);
        } else {
          setHasMore(false);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [token, tab]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchBookings(1);
  }, [tab, fetchBookings]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBookings(nextPage);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchBookings(1, true);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatMoney = (value: string | number) => `${Number(value || 0).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-EG')} ${t('common.currency.egp')}`;

  const formatTime = (value?: string | null) => {
    if (!value) return '-';
    try {
      const [hours, minutes] = value.split(':').map((part) => Number(part));
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return value;
    }
  };

  const renderBooking = ({ item, index }: { item: Booking; index: number }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.cardContainer}
    >
      <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingLeft}>
            <Text style={[styles.bookingName, { color: colors.textPrimary }]} numberOfLines={1}>{item.service_name}</Text>
            {item.provider_name && (
              <Text style={[styles.providerName, { color: colors.pink }]}>{item.provider_name}</Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: (STATUS_COLORS[item.status] || colors.pink) + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || colors.pink }]}>
              {t(`status.${item.status}`)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.location || t('bookings.noLocation')}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.textMuted} />
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatDate(item.booking_date)}</Text>
          </View>
          {item.start_time && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>{formatTime(item.start_time)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.footer}>
          <View>
            <Text style={[styles.totalLabel, { color: colors.textMuted }]}>{t('cart.totalAmount')}</Text>
            <Text style={[styles.totalValue, { color: colors.textPrimary }]}>{formatMoney(item.booking_price)}</Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({ pathname: '/booking/[id]' as any, params: { id: String(item.booking_id) } });
            }}
            style={styles.detailsBtnWrapper}
          >
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewDetailsBtn}
            >
              <Text style={styles.viewDetailsText}>{t('common.details')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="white" />
            </LinearGradient>
          </Pressable>

        </View>
      </GlassView>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      {/* Static Header & Tabs - Always Visible */}
      <View style={styles.staticHeader}>
        <CenteredHeader title="bookings.myBookings" titleColor={colors.textPrimary} />
        <View style={styles.tabContainer}>
          <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.tabRow, { borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Pressable
              style={[styles.tab]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab('upcoming');
              }}
            >
              {tab === 'upcoming' && (
                <Animated.View layout={LinearTransition} style={[StyleSheet.absoluteFill, styles.tabHighlight, { backgroundColor: colors.pink }]} />
              )}
              <Text style={[styles.tabText, { color: tab === 'upcoming' ? 'white' : colors.textSecondary }]}>{t('bookings.upcoming')}</Text>
            </Pressable>
            <Pressable
              style={[styles.tab]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTab('completed');
              }}
            >
              {tab === 'completed' && (
                <Animated.View layout={LinearTransition} style={[StyleSheet.absoluteFill, styles.tabHighlight, { backgroundColor: colors.pink }]} />
              )}
              <Text style={[styles.tabText, { color: tab === 'completed' ? 'white' : colors.textSecondary }]}>{t('status.completed')}</Text>
            </Pressable>
          </GlassView>
        </View>
      </View>

      {/* Dynamic Content Area */}
      {loading && !refreshing ? (
        <ScrollView contentContainerStyle={styles.skeletonContainer} showsVerticalScrollIndicator={false}>
          {[1, 2, 3].map(i => (
            <GlassView key={i} intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <View style={{ flex: 1 }}>
                  <SkeletonBone width={140} height={20} />
                  <SkeletonBone width={100} height={14} style={{ marginTop: 8 }} />
                </View>
                <SkeletonBone width={80} height={26} borderRadius={13} />
              </View>
              <SkeletonBone width={width - 80} height={14} style={{ marginTop: 12 }} />
              <View style={styles.skeletonMeta}>
                <SkeletonBone width={100} height={14} />
                <SkeletonBone width={80} height={14} />
              </View>
              <View style={styles.skeletonDivider} />
              <View style={styles.skeletonFooter}>
                <View>
                  <SkeletonBone width={60} height={10} />
                  <SkeletonBone width={100} height={20} style={{ marginTop: 4 }} />
                </View>
                <SkeletonBone width={90} height={40} borderRadius={20} />
              </View>
            </GlassView>
          ))}
        </ScrollView>
      ) : bookings.length === 0 ? (
        <ScrollView contentContainerStyle={styles.center} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown} style={styles.emptyContent}>
            <GlassView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.emptyIconContainer, { borderColor: 'rgba(255,255,255,0.1)' }]}>
              <MaterialCommunityIcons name="calendar-blank" size={48} color={colors.pink} />
            </GlassView>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('bookings.emptyTitle', { status: t(tab === 'upcoming' ? 'bookings.upcomingLower' : 'status.completedLower') })}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('bookings.emptySubtitle', { status: t(tab === 'upcoming' ? 'bookings.upcomingLower' : 'status.completedLower') })}</Text>
          </Animated.View>
        </ScrollView>
      ) : (
        <TypedFlashList
          data={bookings}
          keyExtractor={(item: any) => item.booking_id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.list}
          estimatedItemSize={200}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.pink} colors={[colors.pink]} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.pink} style={{ marginVertical: 20 }} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  staticHeader: { zIndex: 10 },
  center: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContent: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 100 },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  tabContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  tabRow: { flexDirection: 'row', borderRadius: BorderRadius.full, padding: 4, overflow: 'hidden', borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: BorderRadius.full },
  tabHighlight: { borderRadius: BorderRadius.full },
  tabText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, zIndex: 1 },

  cardContainer: { marginBottom: Spacing.md },
  bookingCard: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.xl,
  },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  bookingLeft: { flex: 1, marginRight: Spacing.sm },
  bookingName: { fontFamily: Fonts.bold, fontSize: FontSizes.lg, letterSpacing: 0.3 },
  providerName: { fontFamily: Fonts.bold, fontSize: FontSizes.sm, marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full },
  statusText: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.8 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: Spacing.sm },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.bold, fontSize: FontSizes.xs, opacity: 0.6 },
  divider: { height: 1, marginVertical: Spacing.lg, opacity: 0.1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.6 },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: 20, marginTop: 2 },
  detailsBtnWrapper: { height: 40 },
  viewDetailsBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 12, 
    gap: 4,
    height: '100%',
  },
  viewDetailsText: { color: 'white', fontFamily: Fonts.bold, fontSize: 13 },


  skeletonContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingTop: Spacing.md },
  skeletonCard: { borderRadius: BorderRadius.xxl, padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: Spacing.md },
  skeletonHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  skeletonMeta: { flexDirection: 'row', gap: 16, marginTop: 12 },
  skeletonDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: Spacing.lg },
  skeletonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  emptyIconContainer: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg, overflow: 'hidden', borderWidth: 1 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginBottom: 8 },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, textAlign: 'center', opacity: 0.6, paddingHorizontal: Spacing.xl },
});
