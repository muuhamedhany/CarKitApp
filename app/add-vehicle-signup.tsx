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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/src/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import BackButton from '@/components/BackButton';
import FormInput from '@/components/FormInput';
import PickerModal from '@/components/PickerModal';
import { API_URL } from '@/constants/config';
import { Colors, Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type Make = { make_id: number; name: string };
type Model = { model_id: number; name: string };

export default function AddVehicleSignupScreen() {
  const router = useRouter();
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
    const make = makes.find((m) => m.make_id === item.id)!;
    setSelectedMake(make);
    setSelectedModel(null);
    setModels([]);
    setShowMakePicker(false);
    fetchModels(make.make_id);
  };

  const handleSelectModel = (item: { id: number; label: string }) => {
    const model = models.find((m) => m.model_id === item.id)!;
    setSelectedModel(model);
    setShowModelPicker(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
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
      return;
    }

    setSaving(true);
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
        showToast('success', 'Vehicle Saved!', 'Your car has been added.');
        router.replace('/(tabs)');
      } else {
        showToast('error', 'Error', data.message || 'Could not save vehicle.');
      }
    } catch {
      showToast('error', 'Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackButton onPress={() => router.back()} />

          <Text style={styles.title}>Car Form</Text>
          <Text style={styles.subtitle}>Sign up to start shopping</Text>

          {/* Car Photo */}
          <Text style={styles.label}>Car Photo:</Text>
          <Pressable style={photoUri ? styles.photoPreview : styles.photoBox} onPress={pickImage}>
            {photoUri ? (
              <>
                <Image source={{ uri: photoUri }} style={styles.photoImg} />
                <View style={styles.photoOverlay}>
                  <MaterialCommunityIcons name="camera-outline" size={20} color={Colors.white} />
                </View>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="plus-circle-outline" size={24} color={Colors.purpleLight} />
                <Text style={styles.photoText}>Add Photo</Text>
              </>
            )}
          </Pressable>

          {/* Nickname */}
          <Text style={styles.label}>Name:</Text>
          <FormInput
            icon="car-sports"
            placeholder="Name Your Car"
            value={nickname}
            onChangeText={setNickname}
          />

          {/* Make Picker */}
          <Text style={styles.label}>Make:</Text>
          {loadingMakes ? (
            <ActivityIndicator color={Colors.pink} style={{ marginBottom: Spacing.md }} />
          ) : (
            <Pressable style={styles.pickerBtn} onPress={() => setShowMakePicker(true)}>
              <Text style={[styles.pickerBtnText, selectedMake && styles.pickerBtnTextSelected]}>
                {selectedMake ? selectedMake.name : 'Select Make'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textMuted} />
            </Pressable>
          )}

          {/* Model Picker */}
          <Text style={styles.label}>Model:</Text>
          <Pressable
            style={[styles.pickerBtn, !selectedMake && styles.pickerBtnDisabled]}
            onPress={() => { if (selectedMake) setShowModelPicker(true); }}
          >
            <Text style={[styles.pickerBtnText, selectedModel && styles.pickerBtnTextSelected]}>
              {selectedModel ? selectedModel.name : 'Select Model'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.textMuted} />
          </Pressable>

          {/* Year */}
          <Text style={styles.label}>Year:</Text>
          <FormInput icon="calendar" placeholder="2023" value={year} onChangeText={setYear} keyboardType="numeric" />

          {/* Color */}
          <Text style={styles.label}>Color:</Text>
          <FormInput icon="palette-outline" placeholder="Silver" value={color} onChangeText={setColor} />

          {/* Save Button */}
          <Pressable onPress={handleSave} disabled={saving} style={{ marginTop: Spacing.md }}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveBtnText}>Save Vehicle</Text>}
            </LinearGradient>
          </Pressable>

          {/* Skip */}
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip to Login</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal visible={showMakePicker} title="Select Make" items={makes.map((m) => ({ id: m.make_id, label: m.name }))} selectedId={selectedMake?.make_id} onSelect={handleSelectMake} onClose={() => setShowMakePicker(false)} />
      <PickerModal visible={showModelPicker} title="Select Model" items={models.map((m) => ({ id: m.model_id, label: m.name }))} selectedId={selectedModel?.model_id} onSelect={handleSelectModel} onClose={() => setShowModelPicker(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 60, paddingBottom: 40 },
  title: { color: Colors.pink, fontSize: 30, fontFamily: Fonts.extraBoldItalic, marginBottom: 4 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSizes.md, fontFamily: Fonts.regular, marginBottom: Spacing.xl },
  label: { color: Colors.white, fontSize: FontSizes.sm, fontFamily: Fonts.medium, marginBottom: Spacing.xs, marginTop: Spacing.sm },

  // Photo
  photoBox: {
    width: 140, height: 120, borderRadius: BorderRadius.md,
    borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.cardBorder,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },
  photoPreview: {
    width: 140, height: 120, borderRadius: BorderRadius.md,
    overflow: 'hidden', marginBottom: Spacing.md, position: 'relative',
  },
  photoImg: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  photoOverlay: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 4,
  },
  photoText: { color: Colors.purpleLight, fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4 },

  // Picker trigger
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14, marginBottom: Spacing.xs,
  },
  pickerBtnDisabled: { opacity: 0.5 },
  pickerBtnText: { color: Colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  pickerBtnTextSelected: { color: Colors.textPrimary },

  // Save
  saveBtn: { paddingVertical: 16, borderRadius: BorderRadius.lg, alignItems: 'center' },
  saveBtnText: { color: Colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },

  // Skip
  skipBtn: { alignItems: 'center', marginTop: Spacing.md },
  skipText: { color: Colors.pink, fontFamily: Fonts.medium, fontSize: FontSizes.sm },
});
