import {
  useState } from 'react';
import { View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, CenteredHeader, GlassView} from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { textAlign } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      showToast('warning', t('common.missingFields'), t('auth.missingFieldsMessage'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (password !== confirmPassword) {
      showToast('error', t('auth.reset.mismatchTitle'), t('auth.reset.mismatch'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      showToast('warning', t('auth.signup.weakTitle'), t('auth.reset.weak'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!email || !otp) {
      showToast('error', t('auth.reset.sessionExpiredTitle'), t('auth.reset.sessionExpired'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      router.replace('/forgot-password');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, otp, password);
    setLoading(false);

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', t('common.updateFailed'), result.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', t('auth.reset.updatedTitle'), t('auth.reset.updated'));
      router.replace('/login');
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
        <CenteredHeader title={t('auth.reset.title')} titleColor={colors.pink} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
              {t('auth.reset.subtitle')}
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
                label={t('auth.reset.newPasswordLabel')}
                icon="lock-outline"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                showToggle
                onToggle={() => setShowPassword(!showPassword)}
              />

              <FormInput
                label={t('auth.reset.confirmPasswordLabel')}
                icon="lock-check-outline"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />

              <GradientButton
                title={t('auth.reset.submit')}
                onPress={handleUpdatePassword}
                loading={loading}
                style={{ marginTop: Spacing.sm }}
              />
            </GlassView>
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
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.lg,
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
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
});

