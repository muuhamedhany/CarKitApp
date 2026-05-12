import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { adService, Ad } from '@/services/api/ad.service';
import { CenteredHeader, GlassView} from '@/components';

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string; icon: string; border: string }> = {
  pending: { label: 'Pending Review', bg: 'rgba(249,115,22,0.15)', fg: '#F97316', icon: 'clock-outline', border: 'rgba(249,115,22,0.3)' },
  active:  { label: 'Active',         bg: 'rgba(16,185,129,0.15)',  fg: '#10B981', icon: 'check-circle-outline', border: 'rgba(16,185,129,0.3)' },
  expired: { label: 'Expired',        bg: 'rgba(107,107,128,0.15)', fg: '#6B6B80', icon: 'calendar-remove-outline', border: 'rgba(107,107,128,0.3)' },
  rejected:{ label: 'Rejected',       bg: 'rgba(239,68,68,0.15)',   fg: '#EF4444', icon: 'close-circle-outline', border: 'rgba(239,68,68,0.3)' },
};

function AdCard({ ad, colors, index }: { ad: Ad; colors: any; index: number }) {
  const cfg = STATUS_CONFIG[ad.status] ?? STATUS_CONFIG.pending;
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <View style={[styles.adCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        <View style={styles.adCardContent}>
          <Image source={{ uri: ad.banner_image_url || undefined }} style={styles.adImage} />
          <View style={styles.adInfo}>
            <View style={styles.adHeader}>
              <Text style={[styles.adTitle, { color: colors.textPrimary }]} numberOfLines={1}>{ad.title || 'Untitled Ad'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <Text style={[styles.statusText, { color: cfg.fg }]}>{cfg.label.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={[styles.adStats, { color: colors.textMuted }]}>
              {new Date(ad.created_at).toLocaleDateString('en-EG')} · {Number((ad as any).price || 0).toLocaleString()} EGP
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function PromoteScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const isDark = colors.background === '#000000' || colors.background === '#121212';
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ExpoLinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.pink} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <CenteredHeader title="Promote" titleColor={colors.textPrimary} />
          <Animated.View entering={FadeInDown.delay(100)} style={styles.createAdSection}>
            <Pressable
              style={[styles.createCard, { borderColor: colors.pink }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-ad' as any);
              }}
            >
              <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.createBlur} {...{} as any}>
                <View style={[styles.iconBox, { backgroundColor: colors.pink }]}>
                  <MaterialCommunityIcons name="rocket-launch" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.createTexts}>
                  <Text style={[styles.createTitle, { color: colors.textPrimary }]}>Create New Ad</Text>
                  <Text style={[styles.createSub, { color: colors.textSecondary }]}>Boost your visibility & reach more customers</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.pink} />
              </GlassView>
            </Pressable>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200)} style={[styles.sectionTitle, { color: colors.textPrimary }]}>Existing Ads</Animated.Text>
          {ads.length > 0 ? (
            ads.map((ad, index) => <AdCard key={ad.ad_id} ad={ad} colors={colors} index={index} />)
          ) : (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.emptyContainer}>
              <View style={[styles.emptyGlow, { backgroundColor: colors.pink + '20' }]} />
              <MaterialCommunityIcons name="bullhorn-variant-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No ads yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Promote your products to reach thousands of potential customers.
              </Text>
            </Animated.View>
          )}
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
  content: { padding: Spacing.md, paddingBottom: 100 },
  
  createAdSection: { marginBottom: Spacing.xl },
  createCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, overflow: 'hidden', ...Shadows.md },
  createBlur: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg },
  iconBox: { width: 56, height: 56, borderRadius: BorderRadius.xl, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  createTexts: { flex: 1 },
  createTitle: { fontFamily: Fonts.extraBold, fontSize: 18, marginBottom: 2 },
  createSub: { fontFamily: Fonts.medium, fontSize: 13, opacity: 0.8 },
  
  sectionTitle: { fontFamily: Fonts.extraBold, fontSize: 20, marginBottom: Spacing.lg, letterSpacing: -0.5 },
  
  adCard: { borderRadius: BorderRadius.xl, borderWidth: 1, marginBottom: Spacing.md, overflow: 'hidden', ...Shadows.sm },
  adCardContent: { flexDirection: 'row', padding: Spacing.md },
  adImage: { width: 80, height: 80, borderRadius: BorderRadius.lg, marginRight: Spacing.md },
  adInfo: { flex: 1, justifyContent: 'center' },
  adHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  adTitle: { fontFamily: Fonts.bold, fontSize: 16, flex: 1, marginRight: 8 },
  adStats: { fontFamily: Fonts.medium, fontSize: 13 },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusText: { fontFamily: Fonts.semiBold, fontSize: 11 },

  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, position: 'relative' },
  emptyGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, top: 20 },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  emptySubtitle: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 22 },
});

