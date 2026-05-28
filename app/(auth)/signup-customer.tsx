import {
  useState,
  useEffect } from 'react';
import { View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { FormInput, GradientButton, AuthFooter, SocialButton, Divider, CenteredHeader, GlassView } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { textAlign } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';


export default function SignUpCustomerScreen() {
  const router = useRouter();
  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const { request, response, promptAsync, getGoogleUser } = useGoogleAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const accessToken = response?.type === 'success' ? response.authentication?.accessToken : null;
    if (accessToken) {
      const handleGoogleAuthResponse = async () => {
        setGoogleLoading(true);
        const { userInfo, error } = await getGoogleUser(accessToken);
        if (userInfo) {
          const result = await loginWithGoogle({
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            picture: userInfo.picture,
          });
          setGoogleLoading(false);
          if (result.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/add-vehicle-prompt');
          } else {
            showToast('error', t('auth.signup.failed'), result.message);
          }
        } else {
          setGoogleLoading(false);
          showToast('error', t('auth.signup.failed'), error || 'Could not fetch Google profile.');
        }
      };
      handleGoogleAuthResponse();
    } else if (response?.type === 'error' || response?.type === 'cancel') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      showToast('warning', t('common.missingFields'), t('auth.missingFieldsMessage'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', t('auth.signup.mismatchTitle'), t('auth.signup.mismatch'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password.length < 6) {
      showToast('warning', t('auth.signup.weakTitle'), t('auth.signup.weak'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/add-vehicle-prompt');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', t('auth.signup.failed'), result.message);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!request) {
      showToast('error', t('auth.signup.failed'), 'Google authentication is not initialized yet.');
      return;
    }
    setGoogleLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await promptAsync();
    } catch {
      setGoogleLoading(false);
      showToast('error', t('auth.signup.failed'), 'Google authentication failed to launch.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -50, backgroundColor: colors.pink + '20' }]} />
      <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: colors.purple + '15' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <CenteredHeader title={t('auth.signup.title')} titleColor={colors.pink} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
              {t('auth.signup.subtitle')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formWrapper}>
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
                label={t('auth.signup.fullNameLabel')}
                icon="account-outline"
                placeholder={t('auth.signup.namePlaceholder')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <FormInput
                label={t('auth.signup.emailLabel')}
                icon="email-outline"
                placeholder={t('auth.signup.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />

              <FormInput
                label={t('auth.signup.phoneLabel')}
                icon="phone-outline"
                placeholder={t('auth.signup.phonePlaceholder')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <FormInput
                label={t('auth.signup.passwordLabel')}
                icon="lock-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
              />

              <FormInput
                label={t('auth.signup.confirmPasswordLabel')}
                icon="lock-outline"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                showToggle
                onToggle={() => setShowConfirm(!showConfirm)}
              />

              <GradientButton
                title={t('auth.signup.submit')}
                onPress={handleSignUp}
                loading={loading}
                style={styles.signupBtn}
              />

              <Divider text={t('auth.divider.or')} />

              <SocialButton
                provider="google"
                actionText={googleLoading ? t('auth.login.signingIn') : t('auth.signup.google')}
                onPress={handleGoogleSignUp}
              />
            </GlassView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footer}>
            <AuthFooter
              message={t('auth.signup.haveAccount')}
              actionText={t('auth.selectAccount.login')}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(auth)/login');
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
    paddingBottom: 40
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xl,
    opacity: 0.7,
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
  signupBtn: {
    marginTop: Spacing.md,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
});

