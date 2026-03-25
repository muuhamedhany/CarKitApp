import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { FormInput } from '@/components';
import { GradientButton } from '@/components';
import { BackButton } from '@/components';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      showToast('warning', 'Missing Email', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email.trim());
    setLoading(false);

    if (result.success) {
      showToast('success', 'Code Sent', 'Please check your email for the OTP.');
      router.push({
        pathname: '/otp-verification',
        params: { email: email.trim() },
      } as any);
    } else {
      showToast('error', 'Failed', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}></Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address to receive a 4-digit verification code.
          </Text>

          <Text style={styles.label}>Email Address:</Text>
          <FormInput
            icon="email-outline"
            placeholder="example@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          <View style={{ height: Spacing.xl }} />

          <GradientButton
            title="Send Code"
            onPress={handleSendCode}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.semiBold,
    marginLeft: Spacing.sm,
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
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  label: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xs,
  },
});
