import {
  useCallback,
  useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { adService, Ad } from '@/services/api/ad.service';
import { CenteredHeader, GlassView} from '@/components';
import Text from '@/components/common/LocalizedText';

const STATUS_CONFIG: Record<string, { label: string; bg: string; fg: string; icon: string; border: string }> = {
  pending: { label: 'Pending Review', bg: 'rgba(249,115,22,0.15)', fg: '#F97316', icon: 'clock-outline', border: 'rgba(249,115,22,0.3)' },
  active:  { label: 'Active',         bg: 'rgba(16,185,129,0.15)',  fg: '#10B981', icon: 'check-circle-outline', border: 'rgba(16,185,129,0.3)' },
  expired: { label: 'Expired',        bg: 'rgba(107,107,128,0.15)', fg: '#6B6B80', icon: 'calendar-remove-outline', border: 'rgba(107,107,128,0.3)' },
  rejected:{ label: 'Rejected',       bg: 'rgba(239,68,68,0.15)',   fg: '#EF4444', icon: 'close-circle-outline', border: 'rgba(239,68,68,0.3)' },
};

function AdCard({ ad, colors, isDark, index }: { ad: Ad; colors: any; isDark: boolean; index: number }) {
  const cfg = STATUS_CONFIG[ad.status] ?? STATUS_CONFIG.pending;
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.adCard, { borderColor: colors.cardBorder }]}>
        <View style={styles.adCardContent}>
          <Image source={{ uri: ad.banner_image_url || undefined }} style={styles.adImage} />
          <View style={styles.adInfo}>
            <View style={styles.adHeader}>
              <Text style={[styles.adTitle, { color: colors.textPrimary }]} numberOfLines={1}>{ad.title || 'Untitled Ad'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                <Text style={[styles.statusText, { color: cfg.fg }]}>{cfg.label.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.adFooter}>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={colors.textMuted} />
                <Text style={[styles.adStats, { color: colors.textMuted }]}>
                  {new Date(ad.created_at).toLocaleDateString('en-EG')}
                </Text>
              </View>
              <View style={styles.footerItem}>
                <MaterialCommunityIcons name="cash" size={14} color={colors.pink} />
                <Text style={[styles.adStats, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
                  {Number((ad as any).price || 0).toLocaleString()} EGP
                </Text>
              </View>
            </View>
          </View>
        </View>
      </GlassView>
    </Animated.View>
  );
}

export default function PromoteScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAds = useCallback(async () => {
    try {
      const res = await adService.getMyAds();
      if (res.success && res.data) setAds(res.data);
    } catch {
      showToast('error', 'Error', 'Failed to load your promotions.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(useCallback(() => { loadAds(); }, [loadAds]));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.pink} /></View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.md }]} showsVerticalScrollIndicator={false}>
          <CenteredHeader title="Promotions" titleColor={colors.textPrimary} />
          
          <Animated.View entering={FadeInUp.delay(100)} style={styles.createAdSection}>
            <Pressable
              style={[styles.createCard, { borderColor: colors.pink }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-ad' as any);
              }}
            >
              <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.createBlur}>
                <LinearGradient
                  colors={[colors.pink, colors.purple]}
                  style={styles.iconBox}
                >
                  <MaterialCommunityIcons name="rocket-launch" size={28} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.createTexts}>
                  <Text style={[styles.createTitle, { color: colors.textPrimary }]}>Create New Ad</Text>
                  <Text style={[styles.createSub, { color: colors.textSecondary }]}>Boost visibility & reach more customers</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.pink} />
              </GlassView>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Your History</Text>
          </Animated.View>
          {ads.length > 0 ? (
            ads.map((ad, index) => <AdCard key={ad.ad_id} ad={ad} colors={colors} isDark={isDark} index={index} />)
          ) : (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.emptyContainer}>
              <GlassView intensity={isDark ? 10 : 30} tint={isDark ? 'dark' : 'light'} style={[styles.emptyCard, { borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="bullhorn-variant-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No active ads</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Promote your products to reach thousands of potential customers.
                </Text>
              </GlassView>
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
  adHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  adTitle: { fontFamily: Fonts.bold, fontSize: 16, flex: 1, marginRight: 8 },
  adStats: { fontFamily: Fonts.medium, fontSize: 13 },
  adFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusText: { fontFamily: Fonts.semiBold, fontSize: 10 },

  emptyContainer: { width: '100%' },
  emptyCard: { alignItems: 'center', padding: Spacing.xl, borderRadius: BorderRadius.xxl, borderWidth: 1, overflow: 'hidden' },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: 20, marginTop: Spacing.lg, marginBottom: Spacing.sm },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: 14, textAlign: 'center', paddingHorizontal: Spacing.md, lineHeight: 22, opacity: 0.7 },
});

