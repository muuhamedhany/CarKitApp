import {
  useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, AuthFooter, SocialButton, Divider, GlassView } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { textAlign } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';
import LanguageToggle from '@/components/common/LanguageToggle';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('warning', t('common.missingFields'), t('auth.missingFieldsMessage'));
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
      showToast('error', t('auth.login.failed'), result.message);
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
        showToast('error', t('auth.login.failed'), result.message);
      }
    }, 1000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {isDark && (
        <>
          <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '20' }]} />
          <View style={[styles.orb, { bottom: -150, left: -150, backgroundColor: colors.purple + '15' }]} />
        </>
      )}

      {/* Language Toggle — top right */}
      <View
        style={[
          styles.langToggleWrap,
          {
            top: insets.top + 12,
            ...(Platform.OS === 'android'
              ? (isRTL ? { left: Spacing.lg, right: undefined } : { right: Spacing.lg, left: undefined })
              : {}
            ),
          },
        ]}
      >
        <LanguageToggle />
      </View>

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
            <Text style={[styles.welcomeTitle, { color: colors.pink, textAlign: textAlign(isRTL) }]}>{t('auth.login.title')}</Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
              {t('auth.login.subtitle')}
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.formWrapper}
          >
            <GlassView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.glassCard,
                { borderColor: colors.cardBorder },
                Shadows.lg
              ]}
            >
              <FormInput
                icon="email-outline"
                label={t('auth.login.emailLabel')}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />

              <FormInput
                icon="lock-outline"
                label={t('auth.login.passwordLabel')}
                placeholder={t('auth.login.passwordPlaceholder')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
              />

              <Pressable
                style={[styles.forgotContainer, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}
                onPress={() => router.push('/forgot-password' as any)}
              >
                <Text style={[styles.forgotText, { color: colors.pink }]}>{t('auth.login.forgotPassword')}</Text>
              </Pressable>

              <GradientButton
                title={t('auth.login.submit')}
                onPress={handleLogin}
                loading={loading}
                style={styles.loginBtn}
              />

              <Divider text={t('auth.divider.or')} />

              <SocialButton
                provider="google"
                actionText={googleLoading ? t('auth.login.signingIn') : t('auth.login.google')}
                onPress={handleGoogleLogin}
              />
            </GlassView>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(600).duration(800)}
            style={styles.footer}
          >
            <AuthFooter
              message={t('auth.login.newTo')}
              actionText={t('auth.signup.submit')}
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
  langToggleWrap: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
  },
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
    fontSize: FontSizes.xxxl,
    fontFamily: Fonts.extraBoldItalic,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.sm,
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
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
    marginStart: 4,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
    marginTop: -6,
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

