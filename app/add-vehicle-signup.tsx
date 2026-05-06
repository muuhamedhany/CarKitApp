import { useTheme } from '@/hooks/useTheme';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader, FormInput, PickerModal, GradientButton } from '@/components';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';

const { height } = Dimensions.get('window');

type Make = { make_id: number; name: string };
type Model = { model_id: number; name: string };

export default function AddVehicleSignupScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedMake, setSelectedMake] = useState<Make | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [nickname, setNickname] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingMakes, setLoadingMakes] = useState(true);

  useEffect(() => {
    fetchMakes();
  }, []);

  const fetchMakes = async () => {
    try {
      const res = await fetch(`${API_URL}/vehicles/makes`);
      const data = await res.json();
      if (data.success) setMakes(data.data);
    } catch {
      showToast('error', 'Error', 'Could not load car makes.');
    } finally {
      setLoadingMakes(false);
    }
  };

  const fetchModels = async (makeId: number) => {
    try {
      const res = await fetch(`${API_URL}/vehicles/makes/${makeId}/models`);
      const data = await res.json();
      if (data.success) setModels(data.data);
    } catch {
      showToast('error', 'Error', 'Could not load models.');
    }
  };

  const handleSelectMake = (item: { id: number; label: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const make = makes.find((m) => m.make_id === item.id)!;
    setSelectedMake(make);
    setSelectedModel(null);
    setModels([]);
    setShowMakePicker(false);
    fetchModels(make.make_id);
  };

  const handleSelectModel = (item: { id: number; label: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const model = models.find((m) => m.model_id === item.id)!;
    setSelectedModel(model);
    setShowModelPicker(false);
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const uploadPhotoToSupabase = async (uri: string): Promise<string | null> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) throw new Error('Supabase config missing');

      const uploadUrl = `${supabaseUrl}/storage/v1/object/vehicle-photos/${filePath}`;

      const response = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          'Content-Type': 'image/jpeg',
        },
      });

      if (response.status < 200 || response.status >= 300) {
        console.error('Upload error:', response.body);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { data } = supabase.storage.from('vehicle-photos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (e) {
      console.error('Photo upload error:', e);
      return null;
    }
  };

  const handleSave = async () => {
    if (!selectedModel) {
      showToast('warning', 'Missing Info', 'Please select a make and model.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let photoUrl: string | null = null;
      if (photoUri) {
        showToast('info', 'Uploading', 'Uploading photo...');
        photoUrl = await uploadPhotoToSupabase(photoUri);
        if (!photoUrl) {
          showToast('error', 'Error', 'Photo upload failed.');
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model_id_fk: selectedModel.model_id,
          year: year ? parseInt(year) : null,
          nickname: nickname.trim() || null,
          color: color.trim() || null,
          photo_url: photoUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', 'Vehicle Saved!', 'Your car has been added.');
        router.replace('/(tabs)');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('error', 'Error', data.message || 'Could not save vehicle.');
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

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
            <CenteredHeader title="Add Your Vehicle" titleColor={colors.pink} />
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Customize your experience with your car details
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.glassCard, Shadows.lg]}
            >
              {/* Car Photo */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Vehicle Appearance</Text>
                <Pressable
                  style={({ pressed }) => [
                    photoUri ? styles.photoPreview : styles.photoBox,
                    { borderColor: photoUri ? colors.pink : colors.cardBorder, opacity: pressed ? 0.8 : 1 }
                  ]}
                  onPress={pickImage}
                >
                  {photoUri ? (
                    <>
                      <Image source={{ uri: photoUri }} style={styles.photoImg} />
                      <View style={styles.photoOverlay}>
                        <MaterialCommunityIcons name="camera" size={20} color={colors.white} />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.iconCircle, { backgroundColor: colors.pink + '15' }]}>
                        <MaterialCommunityIcons name="camera-plus" size={28} color={colors.pink} />
                      </View>
                      <Text style={[styles.photoText, { color: colors.textMuted }]}>Add a photo of your car</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Form Fields */}
              <View style={styles.formContainer}>
                <FormInput
                  label="Nickname"
                  icon="tag-outline"
                  placeholder="e.g. My Fast Rider"
                  value={nickname}
                  onChangeText={setNickname}
                />

                <View style={styles.pickerGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Make</Text>
                  {loadingMakes ? (
                    <ActivityIndicator color={colors.pink} style={styles.loader} />
                  ) : (
                    <Pressable
                      style={[styles.pickerBtn, { backgroundColor: colors.backgroundSecondary + '80', borderColor: colors.border }]}
                      onPress={() => setShowMakePicker(true)}
                    >
                      <Text style={[styles.pickerBtnText, { color: selectedMake ? colors.textPrimary : colors.textMuted }]}>
                        {selectedMake ? selectedMake.name : 'Select Make'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
                    </Pressable>
                  )}
                </View>

                <View style={styles.pickerGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Model</Text>
                  <Pressable
                    style={[
                      styles.pickerBtn,
                      { backgroundColor: colors.backgroundSecondary + '80', borderColor: colors.border },
                      !selectedMake && styles.pickerBtnDisabled
                    ]}
                    onPress={() => { if (selectedMake) setShowModelPicker(true); }}
                  >
                    <Text style={[styles.pickerBtnText, { color: selectedModel ? colors.textPrimary : colors.textMuted }]}>
                      {selectedModel ? selectedModel.name : 'Select Model'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: Spacing.md }}>
                    <FormInput
                      label="Year"
                      icon="calendar"
                      placeholder="2024"
                      value={year}
                      onChangeText={setYear}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormInput
                      label="Color"
                      icon="palette-outline"
                      placeholder="Black"
                      value={color}
                      onChangeText={setColor}
                    />
                  </View>
                </View>
              </View>

              <GradientButton
                title={saving ? "Saving..." : "Save Vehicle"}
                onPress={handleSave}
                loading={saving}
                style={styles.saveBtn}
              />

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.replace('/(tabs)');
                }}
                style={styles.skipBtn}
              >
                <Text style={[styles.skipText, { color: colors.pink }]}>Skip for now</Text>
              </Pressable>
            </BlurView>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal
        visible={showMakePicker}
        title="Choose Brand"
        items={makes.map((m) => ({ id: m.make_id, label: m.name }))}
        selectedId={selectedMake?.make_id}
        onSelect={handleSelectMake}
        onClose={() => setShowMakePicker(false)}
      />
      <PickerModal
        visible={showModelPicker}
        title="Choose Model"
        items={models.map((m) => ({ id: m.model_id, label: m.name }))}
        selectedId={selectedModel?.model_id}
        onSelect={handleSelectModel}
        onClose={() => setShowModelPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
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
    opacity: 0.7
  },
  glassCard: {
    borderRadius: BorderRadius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: Spacing.xl,
    overflow: 'hidden',
  },
  section: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.md
  },
  photoBox: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  photoImg: { width: '100%', height: '100%' },
  photoOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  formContainer: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Fonts.bold,
    marginBottom: 6,
    marginLeft: 4,
    opacity: 0.8,
  },
  pickerGroup: {
    marginBottom: Spacing.sm,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  pickerBtnDisabled: { opacity: 0.4 },
  pickerBtnText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm
  },
  loader: {
    marginVertical: 10,
    alignSelf: 'flex-start',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    marginTop: Spacing.xl,
  },
  skipBtn: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingVertical: 10,
  },
  skipText: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.sm,
    textDecorationLine: 'underline',
  },
});
