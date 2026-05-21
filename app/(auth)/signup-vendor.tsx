import {
  useState } from 'react';
import { View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { FormInput, GradientButton, AuthFooter, CenteredHeader, GlassView} from '@/components';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows } from '@/constants/theme';
import { rowDirection, textAlign } from '@/utils/rtl';
import Text from '@/components/common/LocalizedText';

export default function SignUpVendorScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { colors, isDark } = useTheme();
  const { t, isRTL } = useTranslation();
  
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
      showToast('warning', t('common.missingFields'), t('auth.missingFieldsMessage'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (password !== confirmPassword) {
      showToast('error', t('auth.signup.mismatchTitle'), t('auth.signup.mismatch'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (password.length < 6) {
      showToast('warning', t('auth.signup.weakTitle'), t('auth.signup.weak'));
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
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -50, backgroundColor: colors.pink + '20' }]} />
      <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: colors.purple + '15' }]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.flex}
      >
        <CenteredHeader title={t('auth.signup.businessTitle')} titleColor={colors.pink} />

        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false} 
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(200).duration(800)}>
            <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
              {t('auth.signup.subtitle')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.formWrapper}>
            <GlassView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.glassCard,
                { borderColor: colors.cardBorder },
                Shadows.lg
              ]}
            >
              <Text style={[styles.label, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('auth.signup.chooseType')}</Text>
              <View style={[styles.toggleRow, { flexDirection: rowDirection(isRTL) }]}>
                <Pressable
                  style={[
                    styles.toggleButton, 
                    { borderColor: colors.cardBorder }, 
                    role === 'vendor' && { borderColor: colors.pink, backgroundColor: colors.pink + '20' }
                  ]}
                  onPress={() => handleToggle('vendor')}
                >
                  <Text style={[styles.toggleText, { color: colors.textMuted }, role === 'vendor' && { color: colors.pink }]}>{t('auth.signup.vendor')}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.toggleButton, 
                    { borderColor: colors.cardBorder }, 
                    role === 'service_provider' && { borderColor: colors.pink, backgroundColor: colors.pink + '20' }
                  ]}
                  onPress={() => handleToggle('service_provider')}
                >
                  <Text style={[styles.toggleText, { color: colors.textMuted }, role === 'service_provider' && { color: colors.pink }]}>{t('auth.signup.serviceProvider')}</Text>
                </Pressable>
              </View>

              <FormInput 
                label={t('auth.signup.businessNameLabel')}
                icon="domain" 
                placeholder={t('auth.signup.businessNamePlaceholder')}
                value={name} 
                onChangeText={setName} 
                autoCapitalize="words" 
              />

              <FormInput 
                label={t('auth.signup.businessEmailLabel')}
                icon="email-outline" 
                placeholder={t('auth.signup.businessEmailPlaceholder')}
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoComplete="email" 
              />

              <FormInput 
                label={t('auth.signup.businessPhoneLabel')}
                icon="phone-outline" 
                placeholder={t('auth.signup.phonePlaceholder')}
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad" 
              />

              <FormInput 
                label={t('auth.signup.businessAddressLabel')}
                icon="map-marker-outline" 
                placeholder={t('auth.signup.addressPlaceholder')}
                value={address} 
                onChangeText={setAddress} 
                autoCapitalize="words" 
              />

              <FormInput 
                label={t('auth.signup.passwordLabel')}
                icon="lock-outline" 
                placeholder="••••••••" 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry={!showPassword} 
                showToggle 
                onToggle={() => setShowPassword(!showPassword)} 
              />

              <FormInput 
                label={t('auth.signup.confirmPasswordLabel')}
                icon="lock-outline" 
                placeholder="••••••••" 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
                secureTextEntry={!showConfirm} 
                showToggle 
                onToggle={() => setShowConfirm(!showConfirm)} 
              />

              <GradientButton 
                title={t('auth.signup.registerBusiness')}
                onPress={handleContinue} 
                style={{...styles.continueBtn,  width: '100%'}}
              />
            </GlassView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.footer}>
            <AuthFooter 
              message={t('auth.signup.haveAccount')}
              actionText={t('auth.selectAccount.login')}
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
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5, 
    alignItems: 'center', 
    justifyContent: 'center',
    minHeight: 52,
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

