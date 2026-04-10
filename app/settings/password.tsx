import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import { userService } from '@/services/api';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function PasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return showToast('error', 'Missing fields', 'Please fill out all fields.');
    }

    if (newPassword !== confirmPassword) {
      return showToast('error', 'Passwords do not match', 'New password and confirm password must match.');
    }

    if (newPassword.length < 6) {
      return showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const res = await userService.changePassword({ oldPassword: currentPassword, newPassword });
      if (res.success) {
        showToast('success', 'Password Updated', 'Your password has been changed successfully.');
        router.back();
      } else {
        showToast('error', 'Update Failed', res.message || 'Could not update password.');
      }
    } catch (error: any) {
      showToast('error', 'Update Failed', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CenteredHeader
        title="Change Password"
        titleColor={colors.textPrimary}
        rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
      />

      <View style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Current Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Enter current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>New Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>Confirm New Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        <Pressable onPress={handleUpdatePassword} disabled={loading} style={{ marginTop: Spacing.xl }}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Update Password</Text>}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },

  formGroup: { marginBottom: Spacing.lg },
  label: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 50,
  },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.md },
  eyeIcon: { padding: Spacing.sm, marginRight: -Spacing.sm },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: 16, borderRadius: BorderRadius.lg,
  },
  saveBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
