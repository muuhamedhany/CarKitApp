import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

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

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const personalItems: MenuItem[] = [
    { icon: 'car-sports', label: 'My Vehicles', route: '/my-vehicles' },
    { icon: 'package-variant', label: 'My Orders', route: '/my-orders' },
    { icon: 'calendar-check', label: 'My Bookings', route: '/my-bookings' },
    { icon: 'map-marker-outline', label: 'Shipping Addresses', route: '/profile/addresses' },
    { icon: 'credit-card-outline', label: 'Payment Methods', onPress: () => showToast('info', 'Coming Soon', 'Payments is being built.') },
  ];

  const supportItems: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help Center & Support', route: '/support' },
    { icon: 'shield-lock-outline', label: 'Privacy Policy', onPress: () => showToast('info', 'Coming Soon', 'Privacy Policy is being built.') },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => {
    // Dynamically assign icon colors/backgrounds for a premium look
    const getIconStyles = (label: string) => {
      switch (label) {
        case 'My Vehicles': return { color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)' };
        case 'My Orders': return { color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' };
        case 'My Bookings': return { color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' };
        case 'Shipping Addresses': return { color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' };
        case 'Payment Methods': return { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' };
        case 'Help Center & Support': return { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.1)' };
        case 'Privacy Policy': return { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' };
        default: return { color: colors.pink, bg: colors.pinkGlow };
      }
    };

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
          <MaterialCommunityIcons name="account" size={60} color={colors.pink} />
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

      {/* Quick Stats (Clean Redesign) */}
      <View style={styles.statsRow}>
        <BlurView intensity={20} tint="dark" style={[styles.statCard, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>12</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
        </BlurView>
        <BlurView intensity={20} tint="dark" style={[styles.statCard, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>3</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bookings</Text>
        </BlurView>
        <BlurView intensity={20} tint="dark" style={[styles.statCard, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.statNumber, { color: colors.textPrimary }]}>2</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cars</Text>
        </BlurView>
      </View>

      {/* menu list */}
      <View style={styles.menuContainer}>
        <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>ACCOUNT & VEHICLES</Text>
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
      <Pressable onPress={handleLogout} style={[styles.logoutBtn, { borderColor: 'rgba(236, 72, 153, 0.2)' }]}>
        <MaterialCommunityIcons name="logout-variant" size={20} color="#EC4899" />
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
  userName: { fontFamily: Fonts.extraBold, fontSize: FontSizes.xxl },
  userEmail: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, opacity: 0.6, marginTop: 4 },
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
  menuSection: {
    borderRadius: 24, borderWidth: 1,
    overflow: 'hidden', marginBottom: Spacing.xl,
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
    marginBottom: Spacing.xl,
  },
  logoutText: { color: '#EC4899', fontFamily: Fonts.extraBold, fontSize: FontSizes.md },
});
