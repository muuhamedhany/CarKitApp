import { useState, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
// import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { FormInput } from '@/components';
import { GradientButton } from '@/components';
import { AuthFooter } from '@/components';
import { SocialButton } from '@/components';
import { Divider } from '@/components';
import { Colors, Spacing, FontSizes, Fonts } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  // const { request, response, promptAsync, getGoogleUser } = useGoogleAuth(); // Disabled for Expo Go
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showToast('warning', 'Missing Fields', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (result.success) {
      const user = result.user;
      const isVendorOrProvider = user?.role === 'vendor' || user?.role === 'provider';
      const status = user?.verification_status;

      if (isVendorOrProvider && (status === 'pending' || status === 'rejected')) {
        const title = status === 'pending' ? 'Under Review' : 'Account Rejected';
        const msg = status === 'pending' 
          ? 'Your account is pending admin approval.' 
          : 'Your application was not approved. Please contact support.';
        
        showToast(status === 'pending' ? 'info' : 'error', title, msg);
        router.replace('/pending');
      } else {
        showToast('success', 'Welcome Back!', 'Login successful.');
        router.replace('/(tabs)');
      }
    } else {
      showToast('error', 'Login Failed', result.message);
    }
  };

  // Mock Google Login for Expo Go
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    showToast('info', 'Google Login', 'Connecting to Google...');
    
    // Simulate network delay
    setTimeout(async () => {
      const mockUser = {
        id: 'mock_google_id_123',
        name: 'Demo User',
        email: 'demo@carkit.com',
        picture: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
      };
      
      const result = await loginWithGoogle(mockUser);
      setGoogleLoading(false);

      if (result.success) {
        showToast('success', 'Welcome!', `Signed in as ${mockUser.name}`);
        router.replace('/(tabs)');
      } else {
        showToast('error', 'Login Failed', result.message);
      }
    }, 1500);
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
          <Text style={styles.welcomeTitle}>Welcome Back!</Text>
          <Text style={styles.welcomeSubtitle}>Login to your account</Text>

          <Text style={styles.label}>Email:</Text>
          <FormInput
            icon="email-outline"
            placeholder="Your Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>Password:</Text>
          <FormInput
            icon="lock-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            showToggle
            onToggle={() => setShowPassword(!showPassword)}
          />

          <Pressable style={styles.forgotContainer} onPress={() => router.push('/forgot-password' as any)}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Pressable>

          <GradientButton
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={{ marginBottom: Spacing.sm }}
          />

          <Divider />

          <SocialButton
            provider="google"
            actionText={googleLoading ? 'Signing in...' : 'Login with Google'}
            onPress={handleGoogleLogin}
          />

          <View style={{ height: Spacing.xl }} />
          <AuthFooter
            message="Don't have an account?"
            actionText="Sign up"
            onPress={() => router.push('/select-account')}
          />
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
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  welcomeTitle: {
    color: Colors.pink,
    fontSize: 34,
    fontFamily: Fonts.extraBoldItalic,
    marginBottom: 6,
  },
  welcomeSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.xl + 8,
  },
  label: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.xs,
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotText: {
    color: Colors.pink,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.semiBold,
  },
});
