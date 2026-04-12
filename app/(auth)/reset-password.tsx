import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, CenteredHeader } from '@/components';
import { Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const { colors } = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      showToast('error', 'Mismatched Passwords', 'The passwords you entered do not match.');
      return;
    }

    if (password.length < 6) {
      showToast('warning', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    if (!email || !otp) {
      showToast('error', 'Session Expired', 'Please restart the password reset process.');
      router.replace('/forgot-password');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, otp, password);
    setLoading(false);

    if (!result.success) {
      showToast('error', 'Update Failed', result.message);
    } else {
      showToast('success', 'Password Updated', 'Your password has been changed. Please login.');
      router.replace('/login');
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
          <CenteredHeader title="New Password" titleColor={colors.pink} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose a new password for your account.
          </Text>

          <Text style={[styles.label, { color: colors.textPrimary }]}>New Password:</Text>
          <FormInput
            icon="lock-outline"
            placeholder="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            showToggle
            onToggle={() => setShowPassword(!showPassword)}
          />

          <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password:</Text>
          <FormInput
            icon="lock-check-outline"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />

          <View style={{ height: Spacing.lg }} />

          <GradientButton
            title="Update Password"
            onPress={handleUpdatePassword}
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
    paddingHorizontal: Spacing.md,
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
