import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { 
  FadeInUp, 
  FadeInDown, 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, Colors, Shadows, BorderRadius } from '@/constants/theme';

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

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await logout();
    router.replace('/login');
  };

  const quickActions: MenuItem[] = [
    { icon: 'car-sports', label: 'Vehicles', route: '/my-vehicles' },
    { icon: 'package-variant', label: 'Orders', route: '/my-orders' },
    { icon: 'calendar-check', label: 'Bookings', route: '/my-bookings' },
    { icon: 'heart-outline', label: 'Wishlist', route: '/wishlist' },
  ];

  const personalItems: MenuItem[] = [
    { icon: 'map-marker-outline', label: 'Addresses', route: '/profile/addresses' },
    { icon: 'credit-card-outline', label: 'Payments', onPress: () => showToast('info', 'Coming Soon', 'Payments is being built.') },
  ];

  const getIconStyles = (label: string) => {
    switch (label) {
      case 'Vehicles': return { color: '#CD42A8', bg: 'rgba(205, 66, 168, 0.15)' };
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
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: androidTabOffset + 100, paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.profileHeaderCard, { borderColor: colors.cardBorder }]}>
            <View style={styles.headerRow}>
              <View style={[styles.avatarContainer, { borderColor: colors.pink + '50', borderWidth: 1 }]}>
                <LinearGradient
                  colors={[colors.pink, colors.purple]}
                  style={styles.avatarGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.avatarInitial}>{profileInitial}</Text>
                </LinearGradient>
              </View>
              <View style={styles.headerInfo}>
                <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
                <View style={[styles.memberBadge, { backgroundColor: colors.pink + '20' }]}>
                  <MaterialCommunityIcons name="shield-check" size={12} color={colors.pink} />
                  <Text style={[styles.memberBadgeText, { color: colors.pink }]}>VERIFIED MEMBER</Text>
                </View>
              </View>
            </View>
            
            <Pressable
              style={({ pressed }) => [
                styles.editProfileBtn, 
                { 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  opacity: pressed ? 0.7 : 1 
                }
              ]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/profile/edit'); }}
            >
              <Text style={[styles.editProfileText, { color: colors.textPrimary }]}>Edit Profile</Text>
              <MaterialCommunityIcons name="pencil" size={14} color={colors.textPrimary} style={{ marginLeft: 6 }} />
            </Pressable>
          </BlurView>
        </Animated.View>

        {/* Quick Access */}
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={[styles.groupLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>QUICK ACCESS</Animated.Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>

        {/* Account & General */}
        <Animated.Text entering={FadeInDown.delay(700).duration(600)} style={[styles.groupLabel, { color: colors.textSecondary, marginTop: Spacing.xl }]}>ACCOUNT & SETTINGS</Animated.Text>
        <Animated.View entering={FadeInUp.delay(800).duration(800)}>
          <BlurView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.menuSection, { borderColor: colors.cardBorder }]}>
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
          </BlurView>
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
  content: { paddingHorizontal: Spacing.lg },

  profileHeaderCard: {
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: {
    width: 84, height: 84, borderRadius: 42,
    padding: 3,
  },
  avatarGradient: {
    flex: 1, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Fonts.extraBold,
    fontSize: 34, color: '#FFF',
  },
  headerInfo: { flex: 1, marginLeft: Spacing.xl },
  userName: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xxl, letterSpacing: -1 },
  userEmail: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.6, marginTop: 2 },
  memberBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    marginTop: 10, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    gap: 4,
  },
  memberBadgeText: { fontFamily: Fonts.bold, fontSize: 9, letterSpacing: 0.5 },

  editProfileBtn: {
    marginTop: Spacing.xl, 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  editProfileText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

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

