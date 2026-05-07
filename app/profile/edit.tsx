import { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Platform, 
  ScrollView, 
  ActivityIndicator, 
  Dimensions 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, FadeInLeft } from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader, GradientButton, OutlinedButton } from '@/components';
import { userService } from '@/services/api';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

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
        colors={[isDark ? '#0F172A' : '#F8FAFC', isDark ? '#020617' : '#F1F5F9']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View entering={FadeInDown.duration(1000)} style={[styles.orb, styles.orb1, { backgroundColor: colors.pink }]} />
      <Animated.View entering={FadeInUp.duration(1000).delay(200)} style={[styles.orb, styles.orb2, { backgroundColor: colors.purple }]} />

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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.pink, colors.purple]}
                style={styles.avatarGlow}
              />
              <View style={[styles.avatarInner, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.avatarInitial, { color: colors.textPrimary }]}>
                  {name.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <Pressable style={[styles.editBadge, { backgroundColor: colors.pink }]}>
                <MaterialCommunityIcons name="camera" size={16} color="white" />
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Full Name</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
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
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
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
                <Text style={[styles.label, { color: colors.textPrimary, opacity: 0.5 }]}>Email Address</Text>
                <View style={[styles.inputWrapper, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'transparent', opacity: 0.6 }]}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.textMuted }]}
                    value={user?.email || ''}
                    editable={false}
                  />
                  <MaterialCommunityIcons name="lock" size={16} color={colors.textMuted} />
                </View>
                <Text style={[styles.helperText, { color: colors.textMuted }]}>Email cannot be changed</Text>
              </View>
            </BlurView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <GradientButton 
              title="Save Changes" 
              onPress={handleSave} 
              loading={loading}
              style={{ marginTop: Spacing.xl }}
              icon="check"
            />
            
            <OutlinedButton 
              title="Cancel" 
              onPress={() => router.back()} 
              style={{ marginTop: Spacing.md }}
              textColor={colors.textMuted}
            />
          </Animated.View>

          <View style={{ height: Spacing.xxl * 2 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 40 },
  
  orb: {
    position: 'absolute',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    opacity: 0.12,
  },
  orb1: { top: -width * 0.2, right: -width * 0.1 },
  orb2: { bottom: height * 0.2, left: -width * 0.3 },

  avatarContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
    alignSelf: 'center',
    width: 120,
    height: 120,
  },
  avatarGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.3,
    transform: [{ scale: 1.1 }],
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitial: {
    fontFamily: Fonts.bold,
    fontSize: 42,
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#020617', // Match background
  },

  glassCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
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
  helperText: { fontFamily: Fonts.medium, fontSize: 11, marginTop: 6, opacity: 0.5, marginLeft: 4 },
});
