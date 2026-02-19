import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import GradientButton from '@/components/GradientButton';
import BackButton from '@/components/BackButton';
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  
  const { verifyOtp, forgotPassword } = useAuth();
  const { showToast } = useToast();
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const pastedOtp = text.slice(0, 4).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < 4) newOtp[index + i] = digit;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(index + pastedOtp.length, 3)]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 4) {
      showToast('warning', 'Invalid Code', 'Please enter a 4-digit code.');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(email, code);
    setLoading(false);

    if (result.success) {
      showToast('success', 'Verified', 'Please set your new password.');
      router.push({
        pathname: '/reset-password',
        params: { email, otp: code },
      } as any);
    } else {
      showToast('error', 'Verification Failed', result.message);
    }
  };

  const handleResend = async () => {
    setResending(true);
    const result = await forgotPassword(email);
    setResending(false);
    
    if (result.success) {
      showToast('success', 'Code Sent', 'A new code has been sent to your email.');
    } else {
      showToast('error', 'Failed', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Verification</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit code sent to{'\n'}
            <Text style={{ color: Colors.white, fontFamily: Fonts.semiBold }}>{email}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref: any) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={{ height: Spacing.xl }} />

          <GradientButton
            title="Verify Code"
            onPress={handleVerify}
            loading={loading}
          />

          <Pressable 
            style={styles.resendContainer} 
            onPress={handleResend}
            disabled={resending}
          >
            <Text style={styles.resendText}>
              Didn't receive code? <Text style={styles.resendLink}>{resending ? 'Sending...' : 'Resend'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  title: {
    color: Colors.pink,
    fontSize: 28,
    fontFamily: Fonts.extraBoldItalic,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.xl + Spacing.sm,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.white,
    fontSize: 24,
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  resendContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  resendText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
  },
  resendLink: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
});
