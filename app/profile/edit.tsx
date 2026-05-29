import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback,
  useEffect,
  useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { CenteredHeader, FormInput, GlassView, GradientButton, OutlinedButton } from '@/components';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { userService, vendorService } from '@/services/api';
import { providerService } from '@/services/api/provider.service';
import Text from '@/components/common/LocalizedText';

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
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await userService.getProfile();
      if (res.success && res.data) {
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
      }

      if (user?.role === 'vendor' && user?.vendor_id) {
        const vendorRes = await vendorService.getVendorById(user.vendor_id);
        if (vendorRes.success && vendorRes.data) {
          setProfilePhotoUrl(vendorRes.data.profile_photo_url || null);
        }
      } else if (user?.role === 'provider' && user?.provider_id) {
        const providerRes = await providerService.getProviderById(user.provider_id);
        if (providerRes.success && providerRes.data) {
          setProfilePhotoUrl(providerRes.data.profile_photo_url || null);
        }
      }
    } catch (e) {
      console.log('Profile fetch error', e);
    } finally {
      setInitialFetch(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePickImage = () => {
    Alert.alert(
      'Profile Photo',
      'Choose source for profile photo:',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: chooseFromLibrary },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const takePhoto = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        uploadPhoto(result.assets[0].uri, result.assets[0].fileName || 'photo.jpg');
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Selection Failed', 'Failed to capture photo.');
    }
  };

  const chooseFromLibrary = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        Alert.alert('Permission Denied', 'Gallery permission is required to choose photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
        uploadPhoto(asset.uri, fileName);
      }
    } catch (e) {
      console.error(e);
      showToast('error', 'Selection Failed', 'Failed to select photo.');
    }
  };

  const uploadPhoto = async (uri: string, fileName: string) => {
    setUploadingPhoto(true);
    try {
      const fileExt = fileName.split('.').pop() || 'jpg';
      const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `profile_photos/${newFileName}`;
      const contentType = 'image/jpeg';

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase Config Missing');
      }

      const uploadUrl = `${supabaseUrl}/storage/v1/object/documents/${filePath}`;

      const response = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          'Content-Type': contentType,
        },
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { supabase } = await import('@/lib/supabase');
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      if (publicUrlData?.publicUrl) {
        setProfilePhotoUrl(publicUrlData.publicUrl);
        showToast('success', 'Photo Uploaded', 'Profile photo uploaded successfully.');
      } else {
        throw new Error('Could not get public URL');
      }
    } catch (e: any) {
      console.error('Photo Upload Error', e);
      showToast('error', 'Upload Failed', e.message || 'Failed to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

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
        if (user?.role === 'vendor') {
          const vendorRes = await vendorService.updateVendorProfile({
            name,
            profile_photo_url: profilePhotoUrl
          });
          if (!vendorRes.success) {
            showToast('warning', 'Store Update Failed', vendorRes.message || 'Could not update vendor details.');
          }
        } else if (user?.role === 'provider') {
          const providerRes = await providerService.updateProviderProfile({
            name,
            profile_photo_url: profilePhotoUrl
          });
          if (!providerRes.success) {
            showToast('warning', 'Provider Update Failed', providerRes.message || 'Could not update provider details.');
          }
        }
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
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />



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

          <CenteredHeader
            title="Edit Profile"
            titleColor={colors.textPrimary}
          />

          {/* Avatar Section */}
          {(user?.role === 'vendor' || user?.role === 'provider') && (
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.avatarSection}>
              <Pressable
                onPress={handlePickImage}
                style={({ pressed }) => [
                  styles.avatarWrapper,
                  styles.avatarGlow,
                  { shadowColor: colors.pink, opacity: pressed || uploadingPhoto ? 0.8 : 1 }
                ]}
                disabled={uploadingPhoto}
              >
                <LinearGradient
                  colors={[colors.pink, colors.purple]}
                  style={styles.avatarRing}
                >
                  <View style={[styles.avatarContainer, { borderColor: colors.surface }]}>
                    {uploadingPhoto ? (
                      <View style={[styles.avatarGradient, { backgroundColor: colors.surfaceMuted }]}>
                        <ActivityIndicator size="small" color={colors.pink} />
                      </View>
                    ) : profilePhotoUrl ? (
                      <Image source={{ uri: profilePhotoUrl }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <LinearGradient
                        colors={[colors.pink + '40', colors.purple + '40']}
                        style={styles.avatarGradient}
                      >
                        <Text style={styles.avatarInitial}>
                          {(name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    )}
                  </View>
                </LinearGradient>
                <View style={[styles.editBadge, { backgroundColor: colors.pink, borderColor: colors.surface }]}>
                  <MaterialCommunityIcons name="camera-outline" size={18} color="#FFF" />
                </View>
              </Pressable>
            </Animated.View>
          )}

          {/* Form Section */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Text style={[styles.sectionLabel, { color: colors.pink }]}>PERSONAL INFO</Text>
            <View style={styles.formSection}>
              <FormInput
                label="Full Name"
                icon="account-outline"
                placeholder="Ex. John Doe"
                value={name}
                onChangeText={setName}
              />

              <FormInput
                label="Phone Number"
                icon="phone-outline"
                placeholder="+1 234 567 890"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <FormInput
                label="Email Address"
                icon="email-outline"
                value={user?.email || ''}
                editable={false}
                containerStyle={{ opacity: 0.7 }}
              />
              <Text style={[styles.helperText, { color: colors.textMuted }]}>Email cannot be changed</Text>
            </View>
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
  content: { paddingHorizontal: Spacing.lg },

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
  formSection: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
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

