import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, AuthFooter, CenteredHeader } from '@/components';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows } from '@/constants/theme';

const { height } = Dimensions.get('window');

export default function SignUpVendorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  
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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/upload-documents',
      params: { role, name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), password },
    });
  };

  const handleToggle = (newRole: 'vendor' | 'service_provider') => {
    Haptics.selectionAsync();
    setRole(newRole);
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
            <CenteredHeader title="Vendor Account" titleColor={colors.pink} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join our network and grow your automotive business
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
              <Text style={[styles.label, { color: colors.textPrimary }]}>Choose Account Type</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[
                    styles.toggleButton, 
                    { borderColor: colors.cardBorder }, 
                    role === 'vendor' && { borderColor: colors.pink, backgroundColor: colors.pink + '20' }
                  ]}
                  onPress={() => handleToggle('vendor')}
                >
                  <Text style={[styles.toggleText, { color: colors.textMuted }, role === 'vendor' && { color: colors.pink }]}>Vendor</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton, 
                    { borderColor: colors.cardBorder }, 
                    role === 'service_provider' && { borderColor: colors.pink, backgroundColor: colors.pink + '20' }
                  ]}
                  onPress={() => handleToggle('service_provider')}
                >
                  <Text style={[styles.toggleText, { color: colors.textMuted }, role === 'service_provider' && { color: colors.pink }]}>Service{'\n'}Provider</Text>
                </Pressable>
              </View>

              <Text style={[styles.label, { color: colors.textPrimary }]}>Business Name</Text>
              <FormInput 
                icon="domain" 
                placeholder="CarKit Solutions Ltd." 
                value={name} 
                onChangeText={setName} 
                autoCapitalize="words" 
              />

              <View style={{ height: Spacing.md }} />

              <Text style={[styles.label, { color: colors.textPrimary }]}>Business Email</Text>
              <FormInput 
                icon="email-outline" 
                placeholder="contact@business.com" 
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

              <Text style={[styles.label, { color: colors.textPrimary }]}>Business Address</Text>
              <FormInput 
                icon="map-marker-outline" 
                placeholder="123 Industrial Way" 
                value={address} 
                onChangeText={setAddress} 
                autoCapitalize="words" 
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
                title="Continue to Verification" 
                onPress={handleContinue} 
                style={styles.continueBtn} 
              />
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footer}>
            <AuthFooter 
              message="Already have a business account?" 
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
  toggleRow: { 
    flexDirection: 'row', 
    gap: Spacing.md, 
    marginBottom: Spacing.lg,
    marginTop: Spacing.xs,
  },
  toggleButton: {
    flex: 1, 
    paddingVertical: Spacing.md, 
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5, 
    alignItems: 'center', 
    justifyContent: 'center',
    height: 60,
  },
  toggleText: { fontSize: 13, fontFamily: Fonts.bold, textAlign: 'center' },
  continueBtn: {
    marginTop: Spacing.lg,
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
});
