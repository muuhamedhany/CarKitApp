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
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

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
      style={styles.menuItem}
      onPress={() => {
        if (item.route) router.push(item.route as any);
        else if (item.onPress) item.onPress();
      }}
    >
      <MaterialCommunityIcons name={item.icon as any} size={22} color={Colors.purpleLight} />
      <Text style={styles.menuLabel}>{item.label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={styles.title}>Profile</Text>

      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={48} color={Colors.pink} />
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>

        <Pressable style={styles.editProfileBtn}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* Personal Information */}
      <Text style={styles.sectionLabel}>PERSONAL INFORMATION</Text>
      <View style={styles.menuSection}>
        {personalItems.map(renderMenuItem)}
      </View>

      {/* Support & Legal */}
      <Text style={styles.sectionLabel}>SUPPORT & LEGAL</Text>
      <View style={styles.menuSection}>
        {supportItems.map(renderMenuItem)}
      </View>

      {/* Logout */}
      <Pressable onPress={handleLogout} style={styles.logoutBtn}>
        <LinearGradient
          colors={['rgba(233,30,140,0.3)', 'rgba(233,30,140,0.15)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.logoutGradient}
        >
          <MaterialCommunityIcons name="logout" size={20} color={Colors.pink} />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </Pressable>

      <View style={{ height: androidTabOffset + Spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },

  // Header
  title: {
    color: Colors.textPrimary, fontFamily: Fonts.bold,
    fontSize: FontSizes.xl, textAlign: 'center', marginBottom: Spacing.lg,
  },

  // Avatar
  avatarContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 3, borderColor: Colors.pink,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  userName: { color: Colors.textPrimary, fontFamily: Fonts.bold, fontSize: FontSizes.lg },
  userEmail: { color: Colors.textSecondary, fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 2 },
  editProfileBtn: {
    marginTop: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  editProfileText: { color: Colors.purpleLight, fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },

  // Section
  sectionLabel: {
    color: Colors.pink, fontFamily: Fonts.semiBold, fontSize: FontSizes.xs,
    letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.sm,
  },
  menuSection: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.cardBorder,
    overflow: 'hidden', marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: 'rgba(42,42,58,0.5)',
  },
  menuLabel: {
    color: Colors.textPrimary, fontFamily: Fonts.medium,
    fontSize: FontSizes.md, flex: 1, marginLeft: Spacing.md,
  },

  // Logout
  logoutBtn: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.sm },
  logoutGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: BorderRadius.lg,
    gap: 8,
  },
  logoutText: { color: Colors.pink, fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
});
