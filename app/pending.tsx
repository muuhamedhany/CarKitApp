import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { GradientButton } from '@/components';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function PendingScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const isRejected = user?.verification_status === 'rejected';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const roleName = user?.role === 'vendor' ? 'Vendor' : 'Service Provider';

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons 
        name={isRejected ? "alert-circle-outline" : "clock-outline"} 
        size={80} 
        color={isRejected ? Colors.error : Colors.pink} 
        style={styles.icon} 
      />
      
      <Text style={styles.title}>
        {isRejected ? 'Account Rejected' : 'Account Pending'}
      </Text>

      <Text style={styles.subtitle}>
        Hi {user?.name}, your {roleName} account {isRejected ? 'was not approved' : 'is currently under review'}.
      </Text>

      <Text style={styles.message}>
        {isRejected 
          ? 'Unfortunately, your application did not meet our requirements at this time. Please contact our support team at support@carkit.com for more details or to appeal the decision.'
          : 'We will notify you once your documents have been approved. This usually takes 24-48 hours.'
        }
      </Text>

      <GradientButton
        title={isRejected ? "Back to Login" : "Check Again Later (Logout)"}
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
