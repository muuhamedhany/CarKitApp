import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, BackButton } from '@/components';
import { Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const otp = params.otp as string;
  const { resetPassword } = useAuth();
  const { showToast, showAlert } = useToast();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) { showToast('warning', 'Missing Fields', 'Please fill in all fields.'); return; }
    if (password !== confirmPassword) { showToast('warning', 'Password Mismatch', 'Passwords do not match.'); return; }
    if (password.length < 6) { showToast('warning', 'Weak Password', 'Password must be at least 6 characters.'); return; }

    setLoading(true);
    const result = await resetPassword(email, otp, password);
    setLoading(false);

    if (result.success) {
      showAlert({
        title: 'Success!',
        message: 'Your password has been reset successfully. Please login with your new password.',
        type: 'success',
        buttons: [{ text: 'Login Now', onPress: () => router.replace('/login') }],
      });
    } else { showToast('error', 'Reset Failed', result.message); }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <BackButton onPress={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.title, { color: colors.pink }]}>New Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Create a new, strong password for your account.</Text>
          <Text style={[styles.label, { color: colors.textPrimary }]}>New Password:</Text>
          <FormInput icon="lock-outline" placeholder="New Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} />
          <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password:</Text>
          <FormInput icon="lock-check-outline" placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
          <View style={{ height: Spacing.xl }} />
          <GradientButton title="Reset Password" onPress={handleReset} loading={loading} />
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
