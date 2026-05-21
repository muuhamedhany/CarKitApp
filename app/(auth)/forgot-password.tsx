import {
  useState } from 'react';
import { View,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
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
import { FormInput, GradientButton, AuthFooter, CenteredHeader, GlassView} from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { textAlign } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showToast('warning', t('auth.forgot.missingEmailTitle'), t('auth.forgot.missingEmail'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);

    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', t('common.error'), result.message);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', t('auth.forgot.codeSentTitle'), t('auth.forgot.codeSent'));
      router.push({
        pathname: '/otp-verification',
        params: { email: email.trim() }
      });
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
      ><CenteredHeader title={t('auth.forgot.title')} titleColor={colors.pink} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
              {t('auth.forgot.subtitle')}
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
                label={t('auth.forgot.emailLabel')}
                icon="email-outline"
                placeholder={t('auth.forgot.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoComplete="email"
              />

              <GradientButton
                title={t('auth.forgot.submit')}
                onPress={handleResetPassword}
                loading={loading}
              />
            </GlassView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footer}>
            <AuthFooter
              message={t('auth.forgot.remember')}
              actionText={t('auth.forgot.backToLogin')}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace('/login');
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
    marginStart: 4,
  },
  footer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
});

