import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, AuthFooter, CenteredHeader } from '@/components';
import { Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      showToast('warning', 'Missing Email', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);

    if (!result.success) {
      showToast('error', 'Error', result.message);
    } else {
      showToast('success', 'Code Sent', 'Please check your email for the 4-digit recovery code.');
      router.push({
        pathname: '/otp-verification',
        params: { email: email.trim() }
      });
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
          <CenteredHeader title="Reset Password" titleColor={colors.pink} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter your email to receive a 4-digit recovery code.
          </Text>

          <Text style={[styles.label, { color: colors.textPrimary }]}>Email:</Text>
          <FormInput
            icon="email-outline"
            placeholder="Your Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          <View style={{ height: Spacing.lg }} />

          <GradientButton
            title="Send Code"
            onPress={handleResetPassword}
            loading={loading}
          />

          <View style={{ height: Spacing.xl }} />
          <AuthFooter
            message="Remember your password?"
            actionText="Login"
            onPress={() => router.replace('/login')}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: 28,
    paddingBottom: 0,
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.xl + 8,
    marginTop: 6,
  },
  label: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xs,
  },
});
