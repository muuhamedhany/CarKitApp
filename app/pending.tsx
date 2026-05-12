import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { GradientButton, GlassView } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function PendingScreen() {
  const router = useRouter();
  const { logout, user } = useAuth();
  const { colors, isDark } = useTheme();
  const isRejected = user?.verification_status === 'rejected';

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const roleName = user?.role === 'vendor' ? 'Vendor' : 'Service Provider';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: -100, left: -100, backgroundColor: colors.purple + '10' }]} />

      <Animated.View 
        entering={FadeInUp.delay(200).duration(800)}
        style={styles.content}
      >
        <GlassView
          intensity={isDark ? 30 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={styles.glassContainer}
        >
          <View style={[styles.iconWrapper, { backgroundColor: isRejected ? colors.error + '15' : colors.pink + '15' }]}>
            <MaterialCommunityIcons
              name={isRejected ? "alert-circle-outline" : "clock-check-outline"}
              size={60}
              color={isRejected ? colors.error : colors.pink}
            />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isRejected ? 'Application\nStatus' : 'Under Review'}
          </Text>
          
          <View style={[styles.statusBadge, { backgroundColor: isRejected ? colors.error + '10' : colors.pink + '10' }]}>
             <Text style={[styles.statusText, { color: isRejected ? colors.error : colors.pink }]}>
               {isRejected ? 'REJECTED' : 'PENDING APPROVAL'}
             </Text>
          </View>

          <Text style={[styles.subtitle, { color: colors.textPrimary }]}>
            Hi {user?.name}, your {roleName} account {isRejected ? 'was not approved' : 'is currently being verified'}.
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {isRejected
              ? 'Unfortunately, your application did not meet our requirements at this time. Please contact our support team for more details.'
              : 'We are currently reviewing your documents. You will receive a notification once your account is activated.'
            }
          </Text>

          <View style={styles.divider} />

          <GradientButton
            title={isRejected ? "Back to Login" : "Log Out"}
            onPress={handleLogout}
            style={styles.button}
          />
          
          {!isRejected && (
            <Text style={[styles.footerNote, { color: colors.textMuted }]}>
              Estimated time: 24-48 hours
            </Text>
          )}
        </GlassView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orb: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  content: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  glassContainer: {
    width: '100%',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    borderRadius: BorderRadius.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: Fonts.extraBold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 38,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: Spacing.xl,
  },
  statusText: {
    fontSize: 12,
    fontFamily: Fonts.bold,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
    textAlign: 'center',
    lineHeight: 28,
  },
  message: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
    opacity: 0.8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: Spacing.xl,
  },
  button: { width: '100%' },
  footerNote: {
    marginTop: Spacing.lg,
    fontSize: 12,
    fontFamily: Fonts.medium,
    opacity: 0.6,
  }
});
