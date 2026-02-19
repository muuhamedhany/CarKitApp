import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '@/contexts/ToastContext';
import FormInput from '@/components/FormInput';
import GradientButton from '@/components/GradientButton';
import AuthFooter from '@/components/AuthFooter';
import BackButton from '@/components/BackButton';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

export default function SignUpVendorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [role, setRole] = useState<'vendor' | 'service_provider'>('vendor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !password || !confirmPassword) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showToast('warning', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    // Navigate to document upload screen, passing vendor info
    router.push({
      pathname: '/upload-documents',
      params: {
        role,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        password,
      },
    });
  };

  return (
    <View style={styles.container}>
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

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to start selling</Text>

          {/* Role Toggle */}
          <Text style={styles.label}>Choose What you will do:</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, role === 'vendor' && styles.toggleActive]}
              onPress={() => setRole('vendor')}
            >
              <Text style={[styles.toggleText, role === 'vendor' && styles.toggleTextActive]}>
                Vendor
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, role === 'service_provider' && styles.toggleActive]}
              onPress={() => setRole('service_provider')}
            >
              <Text style={[styles.toggleText, role === 'service_provider' && styles.toggleTextActive]}>
                Service{'\n'}Provider
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Name:</Text>
          <FormInput icon="domain" placeholder="Your Business Name" value={name} onChangeText={setName} autoCapitalize="words" />

          <Text style={styles.label}>Email:</Text>
          <FormInput icon="email-outline" placeholder="Your Business Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />

          <Text style={styles.label}>Phone Number:</Text>
          <FormInput icon="phone-outline" placeholder="Your Business Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Address:</Text>
          <FormInput icon="map-marker-outline" placeholder="Your Business Address" value={address} onChangeText={setAddress} autoCapitalize="words" />

          <Text style={styles.label}>Password:</Text>
          <FormInput icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} />

          <Text style={styles.label}>Confirm Password:</Text>
          <FormInput icon="lock-outline" placeholder="Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} showToggle onToggle={() => setShowConfirm(!showConfirm)} />

          <GradientButton title="Continue" onPress={handleContinue} loading={loading} style={{ marginTop: Spacing.sm }} />

          <View style={{ height: Spacing.lg }} />
          <AuthFooter message="Already have an account?" actionText="Login" onPress={() => router.push('/login')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: Colors.pink,
    fontSize: 30,
    fontFamily: Fonts.extraBoldItalic,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.lg,
  },
  label: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xs,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleActive: {
    borderColor: Colors.pink,
    backgroundColor: 'rgba(233, 30, 140, 0.1)',
  },
  toggleText: {
    color: Colors.textMuted,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
    textAlign: 'center',
  },
  toggleTextActive: {
    color: Colors.pink,
  },
});
