import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, AuthFooter, SocialButton, Divider } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const user = result.user;
      const isVendorOrProvider = user?.role === 'vendor' || user?.role === 'provider';
      const status = user?.verification_status;

      if (isVendorOrProvider && (status === 'pending' || status === 'rejected')) {
        router.replace('/pending');
      } else if (user?.role === 'vendor') {
        router.replace('/(vendor-tabs)');
      } else if (user?.role === 'provider') {
        router.replace('/(provider-tabs)');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Login Failed', result.message);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    setTimeout(async () => {
      const mockUser = {
        id: 'mock_google_id_123',
        name: 'Demo User',
        email: 'demo@carkit.com',
        picture: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
      };
      
      const result = await loginWithGoogle(mockUser);
      setGoogleLoading(false);

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else {
        showToast('error', 'Login Failed', result.message);
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '20' }]} />
      <View style={[styles.orb, { bottom: -150, left: -150, backgroundColor: colors.purple + '15' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            entering={FadeInUp.delay(200).duration(800)}
            style={styles.headerSection}
          >
            <Text style={[styles.welcomeTitle, { color: colors.pink }]}>Welcome Back!</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Enter your credentials to continue your journey
            </Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.formWrapper}
          >
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.glassCard,
                { borderColor: colors.cardBorder },
                Shadows.lg
              ]}
            >
              <Text style={[styles.label, { color: colors.textPrimary }]}>Email Address</Text>
              <FormInput
                icon="email-outline"
                placeholder="email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />


              <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
              <FormInput
                icon="lock-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
              />

              <Pressable 
                style={styles.forgotContainer} 
                onPress={() => router.push('/forgot-password' as any)}
              >
                <Text style={[styles.forgotText, { color: colors.pink }]}>Forgot Password?</Text>
              </Pressable>

              <GradientButton
                title="Login"
                onPress={handleLogin}
                loading={loading}
                style={styles.loginBtn}
              />

              <Divider text="OR" />

              <SocialButton
                provider="google"
                actionText={googleLoading ? 'Signing in...' : 'Sign in with Google'}
                onPress={handleGoogleLogin}
              />
            </BlurView>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(600).duration(800)}
            style={styles.footer}
          >
            <AuthFooter
              message="New to CarKit?"
              actionText="Create Account"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/select-account');
              }}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    fontSize: 40,
    fontFamily: Fonts.extraBoldItalic,
    letterSpacing: -1,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
    lineHeight: 22,
    marginTop: 4,
    opacity: 0.8,
  },
  formWrapper: {
    width: '100%',
  },
  glassCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  label: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
  loginBtn: {
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
});
