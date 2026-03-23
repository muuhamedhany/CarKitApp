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
import FormInput from '@/components/FormInput';
import GradientButton from '@/components/GradientButton';
import AuthFooter from '@/components/AuthFooter';
import SocialButton from '@/components/SocialButton';
import Divider from '@/components/Divider';
import BackButton from '@/components/BackButton';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function SignUpCustomerScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
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

    setLoading(true);
    const result = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    setLoading(false);

    if (result.success) {
      showToast('success', 'Account Created!', 'Welcome to CarKit.');
      router.replace('/add-vehicle-prompt');
    } else {
      showToast('error', 'Sign Up Failed', result.message);
    }
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
          <Text style={styles.subtitle}>Sign up to start shopping</Text>

          <Text style={styles.label}>Name:</Text>
          <FormInput icon="account-outline" placeholder="Your Full Name" value={name} onChangeText={setName} autoCapitalize="words" />

          <Text style={styles.label}>Email:</Text>
          <FormInput icon="email-outline" placeholder="Your Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />

          <Text style={styles.label}>Phone Number:</Text>
          <FormInput icon="phone-outline" placeholder="Your Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

          <Text style={styles.label}>Password:</Text>
          <FormInput icon="lock-outline" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} showToggle onToggle={() => setShowPassword(!showPassword)} />

          <Text style={styles.label}>Confirm Password:</Text>
          <FormInput icon="lock-outline" placeholder="Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} showToggle onToggle={() => setShowConfirm(!showConfirm)} />

          <GradientButton title="Sign Up" onPress={handleSignUp} loading={loading} style={{ marginTop: Spacing.sm }} />

          <Divider />

          <SocialButton provider="google" actionText="Sign up with Google" />

          <View style={{ height: Spacing.xl }} />
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
    marginBottom: Spacing.xl,
  },
  label: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xs,
  },
});
