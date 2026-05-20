import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, FormInput, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTranslation } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { userService } from '@/services/api';
import { textAlign } from '@/utils/rtl';

export default function PasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { t, isRTL } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return showToast('error', t('common.missingFields'), t('settings.password.missing'));
    }

    if (newPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return showToast('error', t('settings.password.mismatchTitle'), t('settings.password.mismatch'));
    }

    if (newPassword.length < 6) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return showToast('error', t('settings.password.weakTitle'), t('settings.password.weak'));
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await userService.changePassword({ oldPassword: currentPassword, newPassword });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', t('settings.password.updatedTitle'), t('settings.password.updated'));
        router.back();
      } else {
        showToast('error', t('common.updateFailed'), res.message || t('settings.password.updateFailed'));
      }
    } catch (error: any) {
      showToast('error', t('common.updateFailed'), error.message || t('common.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <CenteredHeader
          title={t('settings.password.title')}
          titleColor={colors.textPrimary}
          rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
        />
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.formSection}>
            <View style={styles.headerInfo}>
              <View style={[styles.iconWrap, { backgroundColor: colors.pink + '20' }]}>
                <MaterialCommunityIcons name="shield-lock-outline" size={28} color={colors.pink} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>{t('settings.password.header')}</Text>
              <Text style={[styles.headerDesc, { color: colors.textMuted, textAlign: textAlign(isRTL) }]}>{t('settings.password.description')}</Text>
            </View>

            <FormInput
              label={t('settings.password.currentLabel')}
              icon="lock-outline"
              placeholder={t('settings.password.currentPlaceholder')}
              secureTextEntry={!showPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              rightIcon={showPassword ? 'eye-off' : 'eye'}
              onRightIconPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPassword(!showPassword);
              }}
            />

            <FormInput
              label={t('auth.reset.newPasswordLabel')}
              icon="lock-plus-outline"
              placeholder={t('settings.password.newPlaceholder')}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <FormInput
              label={t('auth.reset.confirmPasswordLabel')}
              icon="lock-check-outline"
              placeholder={t('settings.password.confirmPlaceholder')}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GradientButton
            title={t('settings.password.update')}
            onPress={handleUpdatePassword}
            loading={loading}
            style={{ marginTop: Spacing.xl }}
            icon="key-change"
          />
          <OutlinedButton
            title={t('common.cancel')}
            onPress={() => router.back()}
            style={{ marginTop: Spacing.md }}
            textColor={colors.textMuted}
          />
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 40 },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  formSection: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  headerInfo: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    marginBottom: 8,
  },
  headerDesc: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    opacity: 0.6,
    paddingHorizontal: Spacing.lg,
  },

  formGroup: { marginBottom: Spacing.lg },
  label: { fontFamily: Fonts.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, opacity: 0.6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md, height: 54,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontFamily: Fonts.medium, fontSize: FontSizes.md },
  eyeIcon: { padding: Spacing.sm, marginRight: -Spacing.xs },
});

