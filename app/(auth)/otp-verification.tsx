import { useState, useRef } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, TextInput, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { GradientButton, BackButton } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const OTP_LENGTH = 4;

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp, forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
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

    // Auto-advance to next input
    if (charToSet !== '' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      // Clear the previous input value visually immediately
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== OTP_LENGTH) {
      showToast('warning', 'Missing Code', `Please enter the full ${OTP_LENGTH}-digit code.`);
      return;
    }

    if (!email) {
      showToast('error', 'Error', 'Email address is missing. Please try again.');
      return;
    }

    setLoading(true);
    setInternalError(null);
    try {
      const result = await verifyOtp(email, fullCode);
      setLoading(false);

      if (!result.success) {
        setInternalError(result.message);
        showToast('error', 'Invalid Code', result.message);
      } else {
        showToast('success', 'Verified', 'Code verified successfully.');
        router.push({
          pathname: '/reset-password' as any,
          params: { email, otp: fullCode },
        });
      }
    } catch (err: any) {
      setLoading(false);
      setInternalError(err?.message || 'Something went wrong');
      showToast('error', 'Exception', err?.message || 'Try again');
    }
  };

  const handleResend = async () => {
    if (!email) return;
    showToast('info', 'Sending...', 'Requesting a new code...');
    const result = await forgotPassword(email);
    if (!result.success) {
      showToast('error', 'Failed to resend', result.message);
    } else {
      showToast('success', 'Code Sent', 'Please check your email for the new code.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton onPress={() => router.back()} />

          <Text style={[styles.title, { color: colors.pink }]}>OTP Verification</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the {OTP_LENGTH}-digit code we sent to your registered email.
          </Text>

          <View style={styles.otpContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: digit ? colors.pink : 'rgba(156, 39, 176, 0.2)',
                    color: colors.textPrimary,
                  }
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
            <Text style={[styles.resendText, { color: colors.textPrimary }]}>Didn't receive a code? </Text>
            <Pressable onPress={handleResend}>
              <Text style={[styles.resendAction, { color: colors.pink }]}>Resend it</Text>
            </Pressable>
          </View>

          {internalError && (
             <Text style={[styles.errorText, { color: colors.error }]}>{internalError}</Text>
          )}

          <View style={styles.spacer} />

          <GradientButton
            title="Verify"
            onPress={handleVerify}
            loading={loading}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontFamily: Fonts.extraBoldItalic,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.xl + 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: Spacing.xl,
    width: '100%',
  },
  otpInput: {
    width: 60,
    height: 64,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    fontSize: 28,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
  },
  resendAction: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  errorText: {
    marginTop: Spacing.md,
    textAlign: 'center',
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  }
});
