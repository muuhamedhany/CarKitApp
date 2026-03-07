import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type MenuItem = {
  icon: string;
  label: string;
  onPress: () => void;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const personalItems: MenuItem[] = [
    { icon: 'car', label: 'My Vehicles', onPress: () => router.push('/my-vehicles' as any) },
    { icon: 'package-variant-closed', label: 'My Orders', onPress: () => router.push('/my-orders' as any) },
    { icon: 'calendar-check', label: 'My Bookings', onPress: () => router.push('/my-bookings' as any) },
    { icon: 'map-marker-outline', label: 'Shipping Addresses', onPress: () => {} },
    { icon: 'credit-card-outline', label: 'Payment Methods', onPress: () => {} },
  ];

  const supportItems: MenuItem[] = [
    { icon: 'help-circle-outline', label: 'Help Center / FAQ', onPress: () => {} },
    { icon: 'headset', label: 'Contact Support', onPress: () => {} },
    { icon: 'shield-check-outline', label: 'Privacy Policy', onPress: () => {} },
  ];

  const renderMenuItem = (item: MenuItem, index: number) => (
    <Pressable key={index} style={styles.menuItem} onPress={item.onPress}>
      <MaterialCommunityIcons name={item.icon as any} size={22} color={Colors.pink} />
      <Text style={styles.menuLabel}>{item.label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </Pressable>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={styles.pageTitle}>Profile</Text>

      {/* Avatar & Info */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={48} color={Colors.pink} />
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <Pressable style={styles.editBtn}>
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </Pressable>
      </View>

      {/* Personal Information */}
      <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
      <View style={styles.menuGroup}>
        {personalItems.map(renderMenuItem)}
      </View>

      {/* Support & Legal */}
      <Text style={styles.sectionTitle}>SUPPORT & LEGAL</Text>
      <View style={styles.menuGroup}>
        {supportItems.map(renderMenuItem)}
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <LinearGradient
          colors={['rgba(233,30,140,0.2)', 'rgba(156,39,176,0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.logoutGradient}
        >
          <MaterialCommunityIcons name="logout" size={20} color={Colors.pink} />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </Pressable>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingTop: 56,
  },
  pageTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.md,
  },
  userName: {
    color: Colors.white,
    fontSize: FontSizes.xl,
    fontFamily: Fonts.bold,
  },
  userEmail: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    marginTop: 4,
  },
  editBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.pink,
  },
  editBtnText: {
    color: Colors.pink,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
  sectionTitle: {
    color: Colors.pink,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.bold,
    letterSpacing: 1.5,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  menuGroup: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuLabel: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
    marginLeft: Spacing.md,
  },
  logoutBtn: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(233,30,140,0.3)',
  },
  logoutText: {
    color: Colors.pink,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
    marginLeft: Spacing.sm,
  },
});
