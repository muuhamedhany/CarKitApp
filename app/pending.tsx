import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import GradientButton from '@/components/GradientButton';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PendingScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="clock-outline" size={80} color={Colors.pink} style={styles.icon} />
      <Text style={styles.title}>Account Pending</Text>
      <Text style={styles.subtitle}>
        Hi {user?.name}, your {user?.role === 'vendor' ? 'Vendor' : 'Service Provider'} account is currently under review by our team.
      </Text>
      <Text style={styles.message}>
        We will notify you once your documents have been approved. This usually takes 24-48 hours.
      </Text>
      <GradientButton
        title="Check Again Later (Logout)"
        onPress={handleLogout}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  icon: {
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.white,
    fontSize: FontSizes.xxl,
    fontFamily: Fonts.extraBold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.pink,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  message: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    maxWidth: 300,
  }
});
