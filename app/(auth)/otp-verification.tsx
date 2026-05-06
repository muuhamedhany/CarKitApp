import { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TextInput, Pressable, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { GradientButton, CenteredHeader } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';

const { height } = Dimensions.get('window');
const OTP_LENGTH = 4;

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp, forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  
  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);
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
      showToast('warning', 'Incomplete Code', `Please enter the full ${OTP_LENGTH}-digit code.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!email) {
      showToast('error', 'Error', 'Email address is missing. Please try again.');
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
        showToast('error', 'Invalid Code', result.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', 'Verified', 'Code verified successfully.');
        router.push({
          pathname: '/reset-password' as any,
          params: { email, otp: fullCode },
        });
      }
    } catch (err: any) {
      setLoading(false);
      setInternalError(err?.message || 'Something went wrong');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Exception', err?.message || 'Try again');
    }
  };

  const handleResend = async () => {
    if (!email) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showToast('info', 'Sending...', 'Requesting a new code...');
    const result = await forgotPassword(email);
    if (!result.success) {
      showToast('error', 'Failed to resend', result.message);
    } else {
      showToast('success', 'Code Sent', 'Please check your email for the new code.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -50, backgroundColor: colors.pink + '20' }]} />
      <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: colors.purple + '15' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <CenteredHeader title="Verification" titleColor={colors.pink} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 4-digit code sent to your email
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formWrapper}>
            <BlurView
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

              <View style={styles.resendContainer}>
                <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                  Didn&apos;t receive a code?{' '}
                </Text>
                <Pressable onPress={handleResend} hitSlop={10}>
                  <Text style={[styles.resendAction, { color: colors.pink }]}>Resend</Text>
                </Pressable>
              </View>

              {internalError && (
                <Text style={[styles.errorText, { color: colors.error }]}>{internalError}</Text>
              )}

              <GradientButton
                title="Verify Code"
                onPress={handleVerify}
                loading={loading}
                style={styles.verifyBtn}
              />
            </BlurView>
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
    paddingTop: height * 0.1,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginBottom: Spacing.xl + 10,
    marginTop: 4,
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
    gap: 16,
    marginBottom: Spacing.xl,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resendText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
  },
  resendAction: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
    textDecorationLine: 'underline',
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
