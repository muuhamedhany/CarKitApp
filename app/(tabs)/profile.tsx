import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, Colors } from '@/constants/theme';

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;
  const username = user?.name?.trim() ?? '';
  const profileInitial = (username.charAt(0) || 'C').toUpperCase();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const quickActions: MenuItem[] = [
    { icon: 'car-sports', label: 'Vehicles', route: '/my-vehicles' },
    { icon: 'package-variant', label: 'Orders', route: '/my-orders' },
    { icon: 'calendar-check', label: 'Bookings', route: '/my-bookings' },
    { icon: 'heart-outline', label: 'Wishlists', onPress: () => showToast('info', 'Coming Soon', 'Wishlists are being built.') },
  ];

  const personalItems: MenuItem[] = [
    { icon: 'map-marker-outline', label: 'Shipping Addresses', route: '/profile/addresses' },
    { icon: 'credit-card-outline', label: 'Payment Methods', onPress: () => showToast('info', 'Coming Soon', 'Payments is being built.') },
  ];

  const getIconStyles = (label: string) => {
    switch (label) {
      case 'Vehicles': return { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' };
      case 'Orders': return { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
      case 'Bookings': return { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' };
      case 'Wishlists': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'My Bookings': return { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' };
      case 'Shipping Addresses': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'Payment Methods': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
      default: return { color: colors.pink, bg: colors.pinkGlow };
    }
  };

  const renderQuickAction = (item: MenuItem) => {
    const iconStyle = getIconStyles(item.label);

    return (
      <Pressable
        key={item.label}
        style={[
          styles.quickActionCard,
          { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder },
        ]}
        onPress={() => {
          if (item.route) router.push(item.route as any);
          else if (item.onPress) item.onPress();
        }}
      >
        <View style={[styles.quickActionIconBox, { backgroundColor: iconStyle.bg }]}>
          <MaterialCommunityIcons name={item.icon as any} size={22} color={iconStyle.color} />
        </View>
        <View style={styles.quickActionTextWrap}>
          <Text style={[styles.quickActionTitle, { color: colors.textPrimary }]}>{item.label}</Text>
          <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
            {item.label === 'Vehicles'
              ? 'Manage & track'
              : item.label === 'Orders'
                ? 'Browse history'
                : item.label === 'Bookings'
                  ? 'View bookings'
                  : 'Saved items'}
          </Text>
        </View>
      </Pressable>
    );
  };
  const renderMenuItem = (item: MenuItem, index: number) => {
    const iconStyle = getIconStyles(item.label);

    return (
      <Pressable
        key={index}
        style={[styles.menuItem, { borderBottomColor: colors.itemSeparator }]}
        onPress={() => {
          if (item.route) router.push(item.route as any);
          else if (item.onPress) item.onPress();
        }}
      >
        <View style={[styles.menuIconBox, { backgroundColor: iconStyle.bg }]}>
          <MaterialCommunityIcons name={item.icon as any} size={20} color={iconStyle.color} />
        </View>
        <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </Pressable>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.profileHeader, { marginTop: insets.top + 20 }]}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.avatarInitial, { color: colors.pink }]}>{profileInitial}</Text>
        </View>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'Car Enthusiast'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>

        <Pressable
          style={[styles.editProfileBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}
          onPress={() => router.push('/profile/edit' as any)}
        >
          <Text style={[styles.editProfileText, { color: colors.textPrimary }]}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* menu list */}
      <View style={styles.menuContainer}>
        <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>QUICK ACCESS</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>

        <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.menuSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          {personalItems.map(renderMenuItem)}
        </View>

        <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>GENERAL</Text>
        <View style={[styles.menuSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <Pressable
            style={[styles.menuItem, { borderBottomColor: 'rgba(255,255,255,0.05)' }]}
            onPress={() => router.push('/settings' as any)}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
              <MaterialCommunityIcons name="cog-outline" size={20} color="#8B5CF6" />
            </View>
            <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Settings</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Logout */}
      <Pressable onPress={handleLogout} style={[styles.logoutBtn, { borderColor: Colors.error }]}>
        <MaterialCommunityIcons name="logout-variant" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>

      <View style={{ height: androidTabOffset + 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: 0 },

  // Header Redesign
  profileHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarInitial: {
    fontFamily: Fonts.extraBold,
    fontSize: 44,
  },
  userName: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xxl },
  userEmail: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.6 },
  editProfileBtn: {
    marginTop: Spacing.lg, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  editProfileText: { fontFamily: Fonts.bold, fontSize: FontSizes.sm },

  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl
  },
  statCard: {
    flex: 0.3,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  statNumber: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xl },
  statLabel: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, opacity: 0.7, marginTop: 2 },

  // menu Container
  menuContainer: { marginBottom: Spacing.xl },
  groupLabel: {
    fontFamily: Fonts.extraBold, fontSize: 11,
    letterSpacing: 1.5, marginBottom: Spacing.md, marginLeft: 4,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: Spacing.md
  },
  quickActionCard: {
    width: '47.5%',
    borderRadius: 24,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 132,
    justifyContent: 'space-between',
    marginBottom: Spacing.sm
  },
  quickActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    fontSize: FontSizes.sm,
    marginTop: 4,
    opacity: 0.7,
  },
  menuSection: {
    borderRadius: 24, borderWidth: 1,
    overflow: 'hidden', marginBottom: Spacing.md
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuLabel: {
    fontFamily: Fonts.bold, fontVariant: ['small-caps'],
    fontSize: FontSizes.md, flex: 1,
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: 20,
    borderWidth: 1, gap: 10,

  },
  logoutText: { color: Colors.error, fontFamily: Fonts.extraBold, fontSize: FontSizes.md },
});
