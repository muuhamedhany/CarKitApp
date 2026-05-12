import { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { vendorService } from '@/services/api/vendor.service';
import { VendorDashboardResponse } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView } from '@/components';
import { useTabReload } from '@/hooks/useTabReload';

export default function VendorProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/login');
  };

  const [dashboard, setDashboard] = useState<VendorDashboardResponse | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useTabReload('profile', () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    // Refresh data
    vendorService.getDashboard().then(res => {
        if (res.success && res.data) setDashboard(res.data);
    }).catch(() => {});
  });

  useFocusEffect(
    useCallback(() => {
      vendorService.getDashboard().then(res => {
        if (res.success && res.data) setDashboard(res.data);
      }).catch(() => {});
    }, [])
  );

  const verificationStatus = (user as any)?.verification_status || 'pending';
  const verificationBadge = verificationStatus === 'verified'
    ? { label: 'Verified', bg: 'rgba(16,185,129,0.1)', fg: '#10B981', icon: 'shield-check' as const }
    : verificationStatus === 'rejected'
    ? { label: 'Rejected', bg: 'rgba(239,68,68,0.1)', fg: '#EF4444', icon: 'shield-off' as const }
    : { label: 'Pending Review', bg: 'rgba(249,115,22,0.1)', fg: '#F97316', icon: 'shield-half-full' as const };

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
        ref={scrollRef}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Vendor Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Manage your business presence</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.profileCard, { borderColor: colors.cardBorder }]}>
            <View style={[styles.avatar, { backgroundColor: colors.pinkGlow }]}>
              <Text style={[styles.avatarText, { color: colors.pink }]}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.name, { color: colors.textPrimary }]}>{user?.name}</Text>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
              <View style={[styles.badge, { backgroundColor: verificationBadge.bg }]}>
                <MaterialCommunityIcons name={verificationBadge.icon} size={14} color={verificationBadge.fg} />
                <Text style={[styles.badgeText, { color: verificationBadge.fg }]}>{verificationBadge.label}</Text>
              </View>
            </View>
          </GlassView>
        </Animated.View>

        {/* Store Stats Summary */}
        <Animated.View entering={FadeInUp.delay(400).duration(800)} style={styles.storeStatsRow}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.storeStat, { borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="package-variant" size={22} color="#6366F1" />
            <Text style={[styles.storeStatValue, { color: colors.textPrimary }]}>{dashboard?.stats.total_products ?? '—'}</Text>
            <Text style={[styles.storeStatLabel, { color: colors.textSecondary }]}>Products</Text>
          </GlassView>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.storeStat, { borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="receipt-text" size={22} color="#10B981" />
            <Text style={[styles.storeStatValue, { color: colors.textPrimary }]}>{dashboard?.stats.total_orders ?? '—'}</Text>
            <Text style={[styles.storeStatLabel, { color: colors.textSecondary }]}>Orders</Text>
          </GlassView>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.storeStat, { borderColor: colors.cardBorder }]}>
            <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.pink} />
            <Text style={[styles.storeStatValue, { color: colors.textPrimary }]}>{dashboard ? Number(dashboard.stats.revenue).toLocaleString('en-EG') : '—'}</Text>
            <Text style={[styles.storeStatLabel, { color: colors.textSecondary }]}>Revenue</Text>
          </GlassView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(800)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.infoGrid, { borderColor: colors.cardBorder }]}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Role</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Vendor</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Vendor ID</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.vendor_id ?? 'N/A'}</Text>
            </View>
          </GlassView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(800)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.section, { borderColor: colors.cardBorder }]}>
            <Pressable 
              style={({ pressed }) => [styles.menuItem, { borderBottomColor: colors.cardBorder, backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/profile/edit');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.pink + '15' }]}>
                <MaterialCommunityIcons name="account-edit" size={22} color={colors.pink} />
              </View>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit Personal Info</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.menuItem, { borderBottomColor: colors.cardBorder, backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                <MaterialCommunityIcons name="storefront" size={22} color="#6366F1" />
              </View>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Store Settings</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.menuItem, { borderBottomColor: colors.cardBorder, backgroundColor: pressed ? 'rgba(255,255,255,0.05)' : 'transparent' }]} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/support');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <MaterialCommunityIcons name="lifebuoy" size={22} color="#10B981" />
              </View>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Support</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [styles.menuItemLast, { backgroundColor: pressed ? 'rgba(239,68,68,0.05)' : 'transparent' }]} 
              onPress={handleLogout}
            >
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
              </View>
              <Text style={[styles.menuText, { color: '#EF4444' }]}>Log Out</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
            </Pressable>
          </GlassView>
        </Animated.View>
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
    paddingBottom: 150,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
    letterSpacing: -1,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    marginTop: 4,
    opacity: 0.8,
  },
  profileCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  infoGrid: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
  },
  userInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  email: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  section: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  menuItemLast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginLeft: Spacing.md,
  },
  storeStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  storeStat: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 4,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  storeStatValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  storeStatLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
});
