import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, AuthFooter, SocialButton, Divider, CenteredHeader } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function SignUpCustomerScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', 'Mismatch', 'Passwords do not match.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password.length < 6) {
      showToast('warning', 'Weak Password', 'Password must be at least 6 characters.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    const result = await register({ name: name.trim(), email: email.trim(), phone: phone.trim(), password });
    setLoading(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/add-vehicle-prompt');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Sign Up Failed', result.message);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -50, backgroundColor: colors.pink + '20' }]} />
      <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: colors.purple + '15' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <CenteredHeader title="Create Account" titleColor={colors.pink} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join CarKit and experience premium car care
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formWrapper}>
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.glassCard,
                { borderColor: colors.cardBorder },
                Shadows.lg
              ]}
            >
              <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name</Text>
              <FormInput 
                icon="account-outline" 
                placeholder="John Doe" 
                value={name} 
                onChangeText={setName} 
                autoCapitalize="words" 
              />

              <View style={{ height: Spacing.md }} />

              <Text style={[styles.label, { color: colors.textPrimary }]}>Email Address</Text>
              <FormInput 
                icon="email-outline" 
                placeholder="john@example.com" 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoComplete="email" 
              />

              <View style={{ height: Spacing.md }} />

              <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number</Text>
              <FormInput 
                icon="phone-outline" 
                placeholder="+1 234 567 890" 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad" 
              />

              <View style={{ height: Spacing.md }} />

              <Text style={[styles.label, { color: colors.textPrimary }]}>Password</Text>
              <FormInput 
                icon="lock-outline" 
                placeholder="••••••••" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword} 
                showToggle 
                onToggle={() => setShowPassword(!showPassword)} 
              />

              <View style={{ height: Spacing.md }} />

              <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm Password</Text>
              <FormInput 
                icon="lock-outline" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showConfirm} 
                showToggle 
                onToggle={() => setShowConfirm(!showConfirm)} 
              />

              <GradientButton 
                title="Create Account" 
                onPress={handleSignUp} 
                loading={loading} 
                style={styles.signupBtn} 
              />

              <Divider text="OR" />

              <SocialButton 
                provider="google" 
                actionText="Sign up with Google" 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              />
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footer}>
            <AuthFooter 
              message="Already have an account?" 
              actionText="Login" 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(auth)/login');
              }} 
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  scrollContent: { 
    flexGrow: 1, 
    paddingHorizontal: Spacing.lg, 
    paddingTop: height * 0.05, 
    paddingBottom: 40 
  },
  subtitle: { 
    fontSize: FontSizes.md, 
    fontFamily: Fonts.medium, 
    textAlign: 'center',
    marginBottom: Spacing.xl, 
    marginTop: 4,
    opacity: 0.7,
  },
  formWrapper: {
    width: '100%',
  },
  glassCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  label: { 
    fontSize: FontSizes.sm, 
    fontFamily: Fonts.bold, 
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  signupBtn: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
});
