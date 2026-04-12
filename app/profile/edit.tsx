import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import { userService } from '@/services/api';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [initialFetch, setInitialFetch] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await userService.getProfile();
      if (res.success && res.data) {
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
      }
    } catch (e) {
      console.log('Profile fetch error', e);
    } finally {
      setInitialFetch(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    if (!name.trim()) {
      return showToast('error', 'Required Field', 'Name cannot be empty.');
    }
    setLoading(true);
    try {
      const res = await userService.updateUser({ name, phone });
      if (res.success) {
        showToast('success', 'Profile Updated', 'Your profile info has been saved.');
        router.back();
      } else {
        showToast('error', 'Update Failed', res.message || 'Could not update profile.');
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CenteredHeader
        title="Edit Profile"
        titleColor={colors.textPrimary}
        rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
      />

      {initialFetch ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Ex. John Doe"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Phone Number</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="+1 234 567 890"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary, opacity: 0.5 }]}>Email (Cannot be changed)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textMuted }]}
                value={user?.email || ''}
                editable={false}
              />
            </View>
          </View>

          <Pressable onPress={handleSave} disabled={loading} style={{ marginTop: Spacing.xl }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: 40 },

  avatarWrap: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  changePhotoBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  changePhotoText: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },

  formGroup: { marginBottom: Spacing.lg },
  label: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, height: 50,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontFamily: Fonts.regular, fontSize: FontSizes.md },

  saveBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, borderRadius: BorderRadius.lg,
  },
  saveBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
