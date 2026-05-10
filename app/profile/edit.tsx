import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, GlassView, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { userService } from '@/services/api';

const { width, height } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return showToast('error', 'Required Field', 'Name cannot be empty.');
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await userService.updateUser({ name, phone });
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />

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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.avatarSection}>
              <View style={styles.avatarWrapper}>
                <View style={[styles.avatarGlow, { shadowColor: colors.pink }]}>
                  <LinearGradient
                    colors={[colors.pink + '30', colors.purple + '20']}
                    style={styles.avatarRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={[styles.avatarContainer, { borderColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)' }]}>
                      <LinearGradient
                        colors={[colors.pink, colors.purple]}
                        style={styles.avatarGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.avatarInitial}>
                          {(name.charAt(0) || user?.name?.charAt(0) || 'C').toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </View>
                <Pressable
                  style={[styles.editBadge, { backgroundColor: colors.pink, borderColor: isDark ? '#1A0B2E' : '#F8F0FF' }]}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <MaterialCommunityIcons name="camera-plus" size={18} color="white" />
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Form Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={[styles.sectionLabel, { color: colors.pink }]}>PERSONAL INFO</Text>
            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={colors.pink} style={styles.inputIcon} />
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
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <MaterialCommunityIcons name="phone-outline" size={20} color={colors.pink} style={styles.inputIcon} />
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

              <View style={[styles.formGroup, { marginBottom: 0 }]}>
                <Text style={[styles.label, { color: colors.textPrimary, opacity: 0.5 }]}>Email Address</Text>
                <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderColor: 'transparent', opacity: 0.7 }]}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textSecondary }]}
                    value={user?.email || ''}
                    editable={false}
                  />
                  <MaterialCommunityIcons name="lock" size={16} color={colors.textMuted} />
                </View>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>Email cannot be changed</Text>
              </View>
            </GlassView>
          </Animated.View>

          {/* Actions Section */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <GradientButton
              title="Save Changes"
              onPress={handleSave}
              loading={loading}
              style={{ marginTop: Spacing.xl }}
              icon="check-circle-outline"
            />

            <OutlinedButton
              title="Cancel"
              onPress={() => router.back()}
              style={{ marginTop: Spacing.md }}
              textColor={colors.textSecondary}
            />
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
  },
  avatarGlow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center', alignItems: 'center',
    padding: 3,
  },
  avatarContainer: {
    width: 94, height: 94, borderRadius: 47,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: {
    fontFamily: Fonts.extraBold,
    fontSize: 40, color: '#FFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    elevation: 4,
  },

  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    marginLeft: 8,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  glassCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },

  formGroup: { marginBottom: Spacing.xl },
  label: { fontFamily: Fonts.bold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, opacity: 0.6 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md, height: 56,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
  helperText: { fontFamily: Fonts.medium, fontSize: 11, marginTop: 8, opacity: 0.5, marginLeft: 4 },
});
