import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { adService, Ad } from '@/services/api/ad.service';
import { CenteredHeader } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string; icon: string }> = {
  pending: { label: 'Pending Review', bg: 'rgba(249,115,22,0.15)', fg: '#F97316', icon: 'clock-outline' },
  active:  { label: 'Active',         bg: 'rgba(16,185,129,0.15)',  fg: '#10B981', icon: 'check-circle-outline' },
  expired: { label: 'Expired',        bg: 'rgba(107,107,128,0.15)', fg: '#6B6B80', icon: 'calendar-remove-outline' },
  rejected:{ label: 'Rejected',       bg: 'rgba(239,68,68,0.15)',   fg: '#EF4444', icon: 'close-circle-outline' },
};

function AdCard({ ad, colors }: { ad: Ad; colors: any }) {
  const cfg = STATUS_CONFIG[ad.status] ?? STATUS_CONFIG.pending;
  const durationLabel =
    ad.duration_days === 7  ? '7 Days'  :
    ad.duration_days === 14 ? '14 Days' : '30 Days';

  return (
    <View style={[styles.adCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
      {/* Banner thumbnail */}
      <View style={[styles.thumbnail, { backgroundColor: colors.imagePlaceholder }]}>
        {ad.banner_image_url ? (
          <Image source={{ uri: ad.banner_image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="image-outline" size={32} color={colors.textMuted} />
        )}
      </View>

      {/* Info */}
      <View style={styles.adInfo}>
        <Text style={[styles.adTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {ad.title || 'Untitled Ad'}
        </Text>
        <Text style={[styles.adMeta, { color: colors.textMuted }]}>
          {durationLabel} · {Number(ad.price).toLocaleString('en-EG')} EGP
        </Text>
        {ad.start_date && ad.end_date ? (
          <Text style={[styles.adDates, { color: colors.textMuted }]}>
            {new Date(ad.start_date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
            {' – '}
            {new Date(ad.end_date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
          </Text>
        ) : (
          <Text style={[styles.adDates, { color: colors.textMuted }]}>
            {new Date(ad.created_at).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        )}
      </View>

      {/* Status badge */}
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <MaterialCommunityIcons name={cfg.icon as any} size={14} color={cfg.fg} />
        <Text style={[styles.statusText, { color: cfg.fg }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

export default function PromoteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAds = useCallback(async () => {
    try {
      const res = await adService.getMyAds();
      if (res.success && res.data) setAds(res.data);
    } catch {
      showToast('error', 'Error', 'Failed to load your promotions.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(useCallback(() => { loadAds(); }, [loadAds]));

  const onRefresh = () => { setRefreshing(true); loadAds(); };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <CenteredHeader title="My Promotions" titleColor={colors.textPrimary} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.pink} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Info card */}
          <View style={[styles.infoCard, { backgroundColor: colors.pinkGlow, borderColor: colors.pink }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={22} color={colors.pink} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Promote your business on the CarKit home screen. Ads are reviewed before going live.
            </Text>
          </View>

          {ads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={[colors.gradientStart + '20', colors.gradientEnd + '20']}
                style={styles.emptyGlow}
              />
              <MaterialCommunityIcons name="bullhorn-variant-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Promotions Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Create your first ad and reach thousands of car owners.
              </Text>
            </View>
          ) : (
            <View style={styles.adList}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Your Ads ({ads.length})
              </Text>
              {ads.map((ad) => (
                <AdCard key={ad.ad_id} ad={ad} colors={colors} />
              ))}
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>
      )}

      {/* FAB: Add an Ad */}
      <Pressable
        style={[styles.fab]}
        onPress={() => router.push('/create-ad' as any)}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.fabText}>Add an Ad</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },

  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
  },
  adList: { marginBottom: Spacing.md },

  adCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  adInfo: { flex: 1 },
  adTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md, marginBottom: 2 },
  adMeta: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: 2 },
  adDates: { fontFamily: Fonts.regular, fontSize: FontSizes.xs },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusText: { fontFamily: Fonts.semiBold, fontSize: 11 },

  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    position: 'relative',
  },
  emptyGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: 20,
  },
  emptyTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 22,
  },

  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.xl,
    right: Spacing.xl,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: '#CD42A8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  fabText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
