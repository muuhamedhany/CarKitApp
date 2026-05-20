import { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { GradientButton, CenteredHeader, GlassView } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import { rowDirection, textAlign } from '@/utils/rtl';

const OTP_LENGTH = 4;

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp, forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleCodeChange = (text: string, index: number) => {
    const formattedText = text.replace(/[^0-9]/g, '');

    // Handle pasting multiple digits (e.g. from clipboard)
    if (formattedText.length > 1) {
      const pasteData = formattedText.slice(0, OTP_LENGTH).split('');
      const newCode = [...code];

      pasteData.forEach((char, i) => {
        if (index + i < OTP_LENGTH) {
          newCode[index + i] = char;
        }
      });

      setCode(newCode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Focus the last filled input
      const focusIndex = Math.min(index + pasteData.length, OTP_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    // Handle normal single digit typing
    const charToSet = formattedText.slice(-1); // Only keep the newest typed character
    const newCode = [...code];
    newCode[index] = charToSet;
    setCode(newCode);

    if (charToSet !== '') {
      Haptics.selectionAsync();
      // Auto-advance to next input
      if (index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      Haptics.selectionAsync();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== OTP_LENGTH) {
      showToast('warning', t('auth.otp.incompleteTitle'), t('auth.otp.incomplete', { length: OTP_LENGTH }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!email) {
      showToast('error', t('common.error'), t('auth.otp.emailMissing'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setInternalError(null);
    try {
      const result = await verifyOtp(email, fullCode);
      setLoading(false);

      if (!result.success) {
        setInternalError(result.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('error', t('auth.otp.invalidTitle'), result.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', t('auth.otp.verifiedTitle'), t('auth.otp.verified'));
        router.push({
          pathname: '/reset-password' as any,
          params: { email, otp: fullCode },
        });
      }
    } catch (err: any) {
      setLoading(false);
      setInternalError(err?.message || 'Something went wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', t('auth.otp.exceptionTitle'), err?.message || t('common.tryAgain'));
    }
  };

  const handleResend = async () => {
    if (!email) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showToast('info', t('auth.otp.sendingTitle'), t('auth.otp.sending'));
    const result = await forgotPassword(email);
    if (!result.success) {
      showToast('error', t('auth.otp.resendFailed'), result.message);
    } else {
      showToast('success', t('auth.forgot.codeSentTitle'), t('auth.otp.codeSent'));
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
      >            <CenteredHeader title={t('auth.otp.title')} titleColor={colors.pink} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
              {t('auth.otp.subtitle')}
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
              <View style={styles.otpContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                      styles.otpInput,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        borderColor: digit ? colors.pink : colors.cardBorder,
                        color: colors.textPrimary,
                      },
                      digit ? Shadows.sm : {}
                    ]}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={OTP_LENGTH}
                    selectTextOnFocus
                  />
                ))}
              </View>



              {internalError && (
                <Text style={[styles.errorText, { color: colors.error }]}>{internalError}</Text>
              )}

              <GradientButton
                title={t('auth.otp.verify')}
                onPress={handleVerify}
                loading={loading}
                style={styles.verifyBtn}
              />
            </GlassView>

            <View style={[styles.resendContainer, { flexDirection: rowDirection(isRTL) }]}>
              <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                {t('auth.otp.noCode')}
              </Text>
              <Pressable onPress={handleResend} hitSlop={10}>
                <Text style={[styles.resendAction, { color: colors.pink }]}>{t('auth.otp.resend')}</Text>
              </Pressable>
            </View>
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
    textAlign: 'center',
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
    width: '100%',
  },
  otpInput: {
    width: 64,
    height: 72,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    fontSize: 32,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  resendContainer: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
  },
  resendAction: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
  },
  verifyBtn: {
    marginTop: Spacing.md,
  },
  errorText: {
    marginBottom: Spacing.md,
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  }
});

