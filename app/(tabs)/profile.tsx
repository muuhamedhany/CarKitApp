import { GlassView } from '@/components';
import { BorderRadius, FontSizes, Fonts, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useRef } from 'react';
import { useTabReload } from '@/hooks/useTabReload';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;

type MenuItem = {
  icon: string;
  label: string;
  route?: string;
  onPress?: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;
  const username = user?.name?.trim() ?? '';
  const profileInitial = (username.charAt(0) || 'C').toUpperCase();
  const scrollRef = useRef<ScrollView>(null);

  useTabReload('profile', () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    // Profile is mostly static but we can trigger a visual refresh if needed
    // or just scroll to top
  });

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logout();
    router.replace('/login');
  };

  const quickActions: MenuItem[] = [
    { icon: 'package-variant', label: 'Orders', route: '/my-orders' },
    { icon: 'calendar-check', label: 'Bookings', route: '/my-bookings' },
    { icon: 'car-sports', label: 'Vehicles', route: '/my-vehicles' },
    { icon: 'heart-outline', label: 'Wishlist', route: '/wishlist' },
  ];

  const personalItems: MenuItem[] = [
    { icon: 'map-marker-outline', label: 'Addresses', route: '/profile/addresses' },
    { icon: 'credit-card-outline', label: 'Payments', route: '/profile/payments' },
  ];

  const getIconStyles = (label: string) => {
    switch (label) {
      case 'Vehicles': return { color: colors.pink, bg: colors.pink + '26' };
      case 'Orders': return { color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)' };
      case 'Bookings': return { color: '#00D2FF', bg: 'rgba(0, 210, 255, 0.15)' };
      case 'Wishlist': return { color: '#F7B733', bg: 'rgba(247, 183, 51, 0.15)' };
      default: return { color: colors.pink, bg: colors.pink + '20' };
    }
  };

  const renderQuickAction = (item: MenuItem, index: number) => {
    const iconStyle = getIconStyles(item.label);

    return (
      <Animated.View
        key={item.label}
        entering={FadeInUp.delay(500 + index * 100).duration(600)}
        style={styles.quickActionWrapper}
      >
        <Pressable
          style={({ pressed }) => [
            styles.quickActionCard,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderColor: colors.cardBorder,
              opacity: pressed ? 0.8 : 1
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (item.route) router.push(item.route as any);
            else if (item.onPress) item.onPress();
          }}
        >
          <View style={[styles.quickActionIconBox, { backgroundColor: iconStyle.bg }]}>
            <MaterialCommunityIcons name={item.icon as any} size={24} color={iconStyle.color} />
          </View>
          <View style={styles.quickActionTextWrap}>
            <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{item.label}</Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
              {item.label === 'Vehicles' ? 'Manage' : item.label === 'Orders' ? 'History' : 'Activity'}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => {
    return (
      <Pressable
        key={index}
        style={[styles.menuItem, !isLast && { borderBottomColor: colors.cardBorder, borderBottomWidth: 1 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (item.route) router.push(item.route as any);
          else if (item.onPress) item.onPress();
        }}
      >
        <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
          <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.textPrimary} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: androidTabOffset + 100, paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.profileHeaderCard, { borderColor: colors.cardBorder }]}>
            {/* Decorative gradient accent inside card */}
            <LinearGradient
              colors={[colors.pink + '12', 'transparent']}
              style={styles.cardAccent}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />

            {/* User Info */}
            <View style={styles.userInfoSection}>
              <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>{user?.name || 'User'}</Text>
              <View style={[styles.emailPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
                <MaterialCommunityIcons name="email-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="middle">{user?.email}</Text>
              </View>
            </View>

            {/* Edit Profile Button */}
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/profile/edit'); }}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
            >
              <LinearGradient
                colors={[colors.pink, colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.editProfileBtn}
              >
                <MaterialCommunityIcons name="account-edit-outline" size={16} color="#FFF" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </LinearGradient>
            </Pressable>
          </GlassView>
        </Animated.View>

        {/* Quick Access */}
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={[styles.groupLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>QUICK ACCESS</Animated.Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>

        {/* Account & General */}
        <Animated.Text entering={FadeInDown.delay(700).duration(600)} style={[styles.groupLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>ACCOUNT & SETTINGS</Animated.Text>
        <Animated.View entering={FadeInUp.delay(800).duration(800)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.menuSection, { borderColor: colors.cardBorder }]}>
            {personalItems.map((item, idx) => renderMenuItem(item, idx, false))}
            <Pressable
              style={styles.menuItem}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/settings'); }}
            >
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }]}>
                <MaterialCommunityIcons name="cog-outline" size={20} color={colors.textPrimary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Settings</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
            </Pressable>
          </GlassView>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(900).duration(800)}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutBtn,
              {
                borderColor: 'rgba(255, 77, 77, 0.3)',
                backgroundColor: 'rgba(255, 77, 77, 0.05)',
                opacity: pressed ? 0.7 : 1
              }
            ]}
          >
            <MaterialCommunityIcons name="logout-variant" size={20} color="#FF4D4D" />
            <Text style={styles.logoutText}>Sign Out</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.5,
  },
  content: { paddingHorizontal: Spacing.md, },

  profileHeaderCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    borderWidth: 1,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 120,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarGlow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center',
    padding: 3,
  },
  avatarContainer: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Fonts.extraBold,
    fontSize: 36, color: '#FFF',
    marginTop: -1,
  },
  userInfoSection: {
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  userName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  emailPill: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 8, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, gap: 6, borderWidth: 1, alignSelf: 'center',
  },
  userEmail: {
    fontFamily: Fonts.medium, fontSize: FontSizes.xs,
  },
  memberBadge: {
    flexDirection: 'row',
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20, gap: 5, borderWidth: 1,
  },
  memberBadgeText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.8 },
  editProfileBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8
  },
  editProfileText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    color: '#FFF',
  },

  groupLabel: {
    fontFamily: Fonts.extraBold, fontSize: 11,
    letterSpacing: 1.5, marginBottom: Spacing.md, marginLeft: 4,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.xs,
  },
  quickActionWrapper: {
    width: '50%',
    padding: Spacing.xs,
  },
  quickActionCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    minHeight: 120,
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  quickActionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionTextWrap: {
    marginTop: Spacing.md,
  },
  quickActionTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: FontSizes.md,
  },
  quickActionSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 2,
    opacity: 0.6,
  },
  menuSection: {
    borderRadius: BorderRadius.xxl, borderWidth: 1,
    overflow: 'hidden', marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 20, paddingHorizontal: Spacing.lg,
  },
  menuIconBox: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md, flex: 1,
  },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: BorderRadius.xxl,
    borderWidth: 1, gap: 10,
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  logoutText: { color: '#FF4D4D', fontFamily: Fonts.extraBold, fontSize: FontSizes.md },
});


