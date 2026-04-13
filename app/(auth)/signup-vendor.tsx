import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, AuthFooter, CenteredHeader } from '@/components';
import { Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

export default function SignUpVendorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { colors } = useTheme();
  const [role, setRole] = useState<'vendor' | 'service_provider'>('vendor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleContinue = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !password || !confirmPassword) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.'); return;
    }
    if (password !== confirmPassword) { showToast('error', 'Mismatch', 'Passwords do not match.'); return; }
    if (password.length < 6) { showToast('warning', 'Weak Password', 'Password must be at least 6 characters.'); return; }

    router.push({
      pathname: '/upload-documents',
      params: { role, name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), password },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <CenteredHeader title="Create Account" titleColor={colors.pink} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign up to start selling</Text>

          <Text style={[styles.label, { color: colors.textPrimary }]}>Choose What you will do:</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, { borderColor: colors.cardBorder }, role === 'vendor' && { borderColor: colors.pink, backgroundColor: colors.pinkGlow }]}
              onPress={() => setRole('vendor')}
            >
              <Text style={[styles.toggleText, { color: colors.textMuted }, role === 'vendor' && { color: colors.pink }]}>Vendor</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, { borderColor: colors.cardBorder }, role === 'service_provider' && { borderColor: colors.pink, backgroundColor: colors.pinkGlow }]}
              onPress={() => setRole('service_provider')}
            >
              <Text style={[styles.toggleText, { color: colors.textMuted }, role === 'service_provider' && { color: colors.pink }]}>Service{'\n'}Provider</Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textPrimary }]}>Name:</Text>
          <FormInput icon="domain" placeholder="Your Business Name" value={name} onChangeText={setName} autoCapitalize="words" />
          <Text style={[styles.label, { color: colors.textPrimary }]}>Email:</Text>
          <FormInput icon="email-outline" placeholder="Your Business Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
          <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number:</Text>
          <FormInput icon="phone-outline" placeholder="Your Business Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Text style={[styles.label, { color: colors.textPrimary }]}>Address:</Text>
          <FormInput icon="map-marker-outline" placeholder="Your Business Address" value={address} onChangeText={setAddress} autoCapitalize="words" />
          <Text style={[styles.label, { color: colors.textPrimary }]}>Password:</Text>
          <FormInput icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} />
          <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password:</Text>
          <FormInput icon="lock-outline" placeholder="Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} showToggle onToggle={() => setShowConfirm(!showConfirm)} />

          <GradientButton title="Continue" onPress={handleContinue} style={{ marginTop: Spacing.sm }} />
          <View style={{ height: Spacing.lg }} />
          <AuthFooter message="Already have an account?" actionText="Login" onPress={() => router.push('/login')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.md, paddingTop: 28, paddingBottom: 40 },
  subtitle: { fontSize: FontSizes.md, fontFamily: Fonts.regular, marginBottom: Spacing.lg, marginTop: 6 },
  label: { fontSize: FontSizes.sm, fontFamily: Fonts.medium, marginBottom: Spacing.xs },
  toggleRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  toggleButton: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  toggleText: { fontSize: FontSizes.md, fontFamily: Fonts.semiBold, textAlign: 'center' },
});
