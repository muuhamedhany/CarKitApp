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
import { LinearGradient } from 'expo-linear-gradient';
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
    { icon: 'map-marker-outline', label: 'Shipping Addresses', onPress: () => showToast('info', 'Coming Soon', 'Addresses is being built.') },
    { icon: 'credit-card-outline', label: 'Payment Methods', onPress: () => showToast('info', 'Coming Soon', 'Payments is being built.') },
  ];

  const supportItems: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help Center / FAQ', onPress: () => showToast('info', 'Coming Soon', 'Help Center is being built.') },
    { icon: 'headset', label: 'Contact Support', onPress: () => showToast('info', 'Coming Soon', 'Support is being built.') },
    { icon: 'shield-lock-outline', label: 'Privacy Policy', onPress: () => showToast('info', 'Coming Soon', 'Privacy Policy is being built.') },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => (
    <Pressable
      key={index}
      style={[styles.menuItem, { borderBottomColor: colors.itemSeparator }]}
      onPress={() => {
        if (item.route) router.push(item.route as any);
        else if (item.onPress) item.onPress();
      }}
    >
      <MaterialCommunityIcons name={item.icon as any} size={22} color={colors.purpleLight} />
      <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.title, { color: colors.textPrimary }]}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatar, { backgroundColor: colors.backgroundSecondary, borderColor: colors.pink }]}>
          <MaterialCommunityIcons name="account" size={48} color={colors.pink} />
        </View>
        <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>

        <Pressable style={[styles.editProfileBtn, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.editProfileText, { color: colors.purpleLight }]}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* Personal Information */}
      <Text style={[styles.sectionLabel, { color: colors.pink }]}>PERSONAL INFORMATION</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        {personalItems.map(renderMenuItem)}
      </View>

      {/* Settings */}
      <Text style={[styles.sectionLabel, { color: colors.pink }]}>GENERAL</Text>
      <View style={[styles.menuSection, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
        <Pressable
          style={[styles.menuItem, { borderBottomColor: colors.itemSeparator }]}
          onPress={() => router.push('/settings' as any)}
        >
          <MaterialCommunityIcons name="cog-outline" size={22} color={colors.purpleLight} />
          <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>Settings</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Logout */}
      <Pressable onPress={handleLogout} style={styles.logoutBtn}>
        <LinearGradient
          colors={['rgba(233,30,140,0.3)', 'rgba(233,30,140,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.logoutGradient}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.pink} />
          <Text style={[styles.logoutText, { color: colors.pink }]}>Logout</Text>
        </LinearGradient>
      </Pressable>

      <View style={{ height: androidTabOffset + Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },

  // Header
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl, textAlign: 'center', marginBottom: Spacing.lg,
  },

  // Avatar
  avatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  userName: { fontFamily: Fonts.bold, fontSize: FontSizes.lg },
  userEmail: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 2 },
  editProfileBtn: {
    marginTop: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  editProfileText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },

  // Section
  sectionLabel: {
    fontFamily: Fonts.semiBold, fontSize: FontSizes.xs,
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  menuSection: {
    borderRadius: BorderRadius.lg, borderWidth: 1,
    overflow: 'hidden', marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  menuLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md, flex: 1, marginLeft: Spacing.md,
  },

  // Logout
  logoutBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  logoutGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: BorderRadius.lg,
    gap: 8,
  },
  logoutText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
});
