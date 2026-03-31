import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, BackButton } from '@/components';
import { Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) { showToast('warning', 'Missing Email', 'Please enter your email address.'); return; }
    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);
    if (result.success) {
      showToast('success', 'Code Sent', 'Please check your email for the OTP.');
      router.push({ pathname: '/otp-verification', params: { email: email.trim() } } as any);
    } else { showToast('error', 'Failed', result.message); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton onPress={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.pink }]}>Forgot Password?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your email address to receive a 4-digit verification code.</Text>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Email Address:</Text>
          <FormInput icon="email-outline" placeholder="example@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
          <View style={{ height: Spacing.xl }} />
          <GradientButton title="Send Code" onPress={handleSendCode} loading={loading} />
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
  subtitle: { fontSize: FontSizes.md, fontFamily: Fonts.regular, marginBottom: Spacing.xl, lineHeight: 22 },
  label: { fontSize: FontSizes.sm, fontFamily: Fonts.medium, marginBottom: Spacing.xs },
});
