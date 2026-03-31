import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { GradientButton, BackButton } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function OtpVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const { verifyOtp, forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pastedOtp = text.slice(0, 4).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => { if (index + i < 4) newOtp[index + i] = digit; });
      setOtp(newOtp);
      inputRefs.current[Math.min(index + pastedOtp.length, 3)]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 4) { showToast('warning', 'Invalid Code', 'Please enter a 4-digit code.'); return; }
    setLoading(true);
    const result = await verifyOtp(email, code);
    setLoading(false);
    if (result.success) {
      showToast('success', 'Verified', 'Please set your new password.');
      router.push({ pathname: '/reset-password', params: { email, otp: code } } as any);
    } else { showToast('error', 'Verification Failed', result.message); }
  };

  const handleResend = async () => {
    setResending(true);
    const result = await forgotPassword(email);
    setResending(false);
    if (result.success) showToast('success', 'Code Sent', 'A new code has been sent to your email.');
    else showToast('error', 'Failed', result.message);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton onPress={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.pink }]}>Verification</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the 4-digit code sent to{'\n'}
            <Text style={{ color: colors.textPrimary, fontFamily: Fonts.semiBold }}>{email}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref: any) => (inputRefs.current[index] = ref)}
                style={[styles.otpInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
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
          <GradientButton title="Verify Code" onPress={handleVerify} loading={loading} />

          <Pressable style={styles.resendContainer} onPress={handleResend} disabled={resending}>
            <Text style={[styles.resendText, { color: colors.textSecondary }]}>
              Didn't receive code? <Text style={[styles.resendLink, { color: colors.primary }]}>{resending ? 'Sending...' : 'Resend'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 80 },
  title: { fontSize: 28, fontFamily: Fonts.extraBoldItalic, marginBottom: Spacing.sm },
  subtitle: { fontSize: FontSizes.md, fontFamily: Fonts.regular, marginBottom: Spacing.xl + Spacing.sm, lineHeight: 22 },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  otpInput: { width: 60, height: 60, borderRadius: BorderRadius.md, borderWidth: 1, fontSize: 24, fontFamily: Fonts.bold, textAlign: 'center' },
  resendContainer: { marginTop: Spacing.lg, alignItems: 'center' },
  resendText: { fontSize: FontSizes.sm, fontFamily: Fonts.medium },
  resendLink: { fontFamily: Fonts.semiBold },
});
