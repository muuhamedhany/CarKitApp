import {
  GlassView } from '@/components';
import { BorderRadius,
  FontSizes,
  Fonts,
  Shadows,
  Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { providerService } from '@/services/api/provider.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useRef,
  useState } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '@/components/common/LocalizedText';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 65;

type MenuItem = {
  icon: string;
  label: string;
  route?: string;
  onPress?: () => void;
  color?: string;
  bg?: string;
};

export default function ProviderProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;
  const scrollRef = useRef<ScrollView>(null);

  const [stats, setStats] = useState({
    todays_bookings: 0,
    total_customers: 0,
    revenue: 0,
  });

  useFocusEffect(
    useCallback(() => {
      providerService
        .getDashboard()
        .then((res) => {
          if (res.success && res.data) {
            setStats(res.data.stats as any);
          }
        })
        .catch(() => { });
    }, [])
  );

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logout();
    router.replace('/login');
  };

  const verificationStatus = (user as any)?.verification_status || 'pending';
  const verBadge =
    verificationStatus === 'verified'
      ? {
        label: 'Verified',
        bg: 'rgba(16,185,129,0.1)',
        fg: '#10B981',
        icon: 'shield-check' as const,
      }
      : verificationStatus === 'rejected'
        ? {
          label: 'Rejected',
          bg: 'rgba(239,68,68,0.1)',
          fg: '#EF4444',
          icon: 'shield-off' as const,
        }
        : {
          label: 'Pending Review',
          bg: 'rgba(249,115,22,0.1)',
          fg: '#F97316',
          icon: 'shield-half-full' as const,
        };

  const quickActions: MenuItem[] = [
    {
      icon: 'calendar-check',
      label: 'Today',
      onPress: () => router.push('/(provider-tabs)/bookings'),
      color: '#6366F1',
      bg: 'rgba(99, 102, 241, 0.15)'
    },
    {
      icon: 'account-group',
      label: 'Customers',
      onPress: () => router.push('/provider-analytics'),
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.15)'
    },
    {
      icon: 'cash-multiple',
      label: 'Revenue',
      onPress: () => router.push('/provider-analytics'),
      color: colors.pink,
      bg: colors.pink + '26'
    },
    {
      icon: 'chart-box-outline',
      label: 'Analytics',
      route: '/provider-analytics',
      color: '#F7B733',
      bg: 'rgba(247, 183, 51, 0.15)'
    },
  ];

  const renderQuickAction = (item: MenuItem, index: number) => {
    let value = '0';
    let subtitle = 'Activity';

    if (item.label === 'Today') {
      value = stats.todays_bookings.toString();
      subtitle = 'Bookings';
    } else if (item.label === 'Customers') {
      value = stats.total_customers.toString();
      subtitle = 'Total';
    } else if (item.label === 'Revenue') {
      value = Number(stats.revenue).toLocaleString('en-EG');
      subtitle = 'Total EGP';
    } else if (item.label === 'Analytics') {
      value = 'View';
      subtitle = 'Insights';
    }

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
              backgroundColor: colors.surfaceElevated,
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
          <View style={[styles.quickActionIconBox, { backgroundColor: item.bg }]}>
            <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
          </View>
          <View style={styles.quickActionTextWrap}>
            <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{value}</Text>
            <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderMenuItem = (item: any, index: number, isLast: boolean) => {
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
        <View style={[styles.menuIconBox, { backgroundColor: item.iconBg || colors.surfaceMuted }]}>
          <MaterialCommunityIcons name={item.icon as any} size={20} color={item.iconColor || colors.textPrimary} />
        </View>
        <Text style={[styles.menuLabel, { color: item.textColor || colors.textPrimary }]}>{item.label}</Text>
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

      {isDark && (
        <>
          <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
          <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: colors.purple + '10' }]} />
        </>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: androidTabOffset + 100, paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.profileHeaderCard, { borderColor: colors.cardBorder }]}>
            <LinearGradient
              colors={[colors.pink + '12', 'transparent']}
              style={styles.cardAccent}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />

            <View style={styles.userInfoSection}>
              <Text style={[styles.userName, { color: colors.textPrimary }]} numberOfLines={1}>{user?.name || 'Provider'}</Text>
              <View style={[styles.emailPill, { backgroundColor: colors.surfaceMuted, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="email-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="middle">{user?.email}</Text>
              </View>

            </View>

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
                <Text style={styles.editProfileText}>Edit Business Profile</Text>
              </LinearGradient>
            </Pressable>
          </GlassView>
        </Animated.View>

        {/* Provider ID & Info */}
        <Animated.View entering={FadeInDown.delay(700).duration(600)}>
          <Text style={[styles.groupLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>ACCOUNT & SETTINGS</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(800).duration(800)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.menuSection, { borderColor: colors.cardBorder }]}>
            <View style={styles.infoRow}>
              <View style={styles.infoColumn}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>Service Provider</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
              <View style={styles.infoColumn}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Provider ID</Text>
                <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{(user as any)?.provider_id ?? 'N/A'}</Text>
              </View>
            </View>
            <View style={[{ borderTopColor: colors.cardBorder, borderTopWidth: 1 }]} />

            {renderMenuItem({
              icon: 'credit-card-outline',
              label: 'profile.payments',
              route: '/profile/payments',
              iconBg: 'rgba(168, 85, 247, 0.1)',
              iconColor: '#A855F7'
            }, 0, false)}

            {renderMenuItem({
              icon: 'map-marker-multiple-outline',
              label: 'profile.serviceBranches',
              route: '/profile/branches',
              iconBg: 'rgba(236, 72, 153, 0.1)',
              iconColor: '#EC4899'
            }, 1, false)}

            {renderMenuItem({
              icon: 'cog-outline',
              label: 'profile.settings',
              route: '/settings',
              iconBg: 'rgba(99, 102, 241, 0.1)',
              iconColor: '#6366F1'
            }, 2, false)}
            
            {renderMenuItem({
              icon: 'lifebuoy',
              label: 'common.support',
              route: '/support',
              iconBg: 'rgba(16, 185, 129, 0.1)',
              iconColor: '#10B981'
            }, 3, true)}
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
  verificationBadge: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, gap: 6, borderWidth: 1, alignSelf: 'center',
  },
  verificationText: {
    fontFamily: Fonts.bold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5
  },
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
  infoRow: {
    flexDirection: 'row',
    padding: Spacing.lg,
    alignItems: 'center',
  },
  infoColumn: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: Fonts.medium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.7,
  },
  infoValue: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
  },
  divider: {
    width: 1,
    height: 30,
    marginHorizontal: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 18, paddingHorizontal: Spacing.lg,
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
