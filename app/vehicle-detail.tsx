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
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader, FormInput, PickerModal } from '@/components';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

const TAB_BAR_HEIGHT = 65;

type Make = { make_id: number; name: string };
type ModelType = { model_id: number; name: string };
type Vehicle = {
  vehicle_id: number;
  model_id_fk: number;
  nickname?: string;
  year?: number;
  color?: string;
  photo_url?: string;
  make_name: string;
  model_name: string;
};

export default function VehicleDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<ModelType[]>([]);
  const [selectedMake, setSelectedMake] = useState<Make | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType | null>(null);
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [nickname, setNickname] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const androidTabOffset = Platform.OS === 'android' ? insets.bottom + TAB_BAR_HEIGHT : 0;

  useEffect(() => {
    fetchVehicleAndMakes();
  }, []);

  const fetchVehicleAndMakes = async () => {
    try {
      const [vehiclesRes, makesRes] = await Promise.all([
        fetch(`${API_URL}/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/vehicles/makes`),
      ]);
      const [vehiclesData, makesData] = await Promise.all([vehiclesRes.json(), makesRes.json()]);

      if (makesData.success) setMakes(makesData.data);

      if (vehiclesData.success) {
        const v = vehiclesData.data.find((item: Vehicle) => item.vehicle_id === parseInt(vehicleId || '0'));
        if (v) {
          setVehicle(v);
          setNickname(v.nickname || '');
          setYear(v.year ? v.year.toString() : '');
          setColor(v.color || '');
          setExistingPhotoUrl(v.photo_url || null);

          const make = makesData.data.find((m: Make) => m.name === v.make_name);
          if (make) {
            setSelectedMake(make);
            const modelsRes = await fetch(`${API_URL}/vehicles/makes/${make.make_id}/models`);
            const modelsData = await modelsRes.json();
            if (modelsData.success) {
              setModels(modelsData.data);
              const model = modelsData.data.find((m: ModelType) => m.name === v.model_name);
              if (model) setSelectedModel(model);
            }
          }
        }
      }
    } catch {
      showToast('error', 'Error', 'Could not load vehicle details.');
    } finally {
      setLoading(false);
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
      setExistingPhotoUrl(null);
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
      let photoUrl: string | null = existingPhotoUrl;

      if (photoUri) {
        showToast('info', 'Uploading', 'Uploading photo...');
        photoUrl = await uploadPhotoToSupabase(photoUri);
        if (!photoUrl) {
          showToast('error', 'Error', 'Photo upload failed.');
          setSaving(false);
          return;
        }
      }

      const res = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: 'PUT',
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
        showToast('success', 'Updated!', 'Vehicle details saved.');
        router.back();
      } else {
        showToast('error', 'Error', data.message || 'Could not update vehicle.');
      }
    } catch {
      showToast('error', 'Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Deleted', 'Vehicle removed successfully.');
        setShowDeleteModal(false);
        router.back();
      } else {
        showToast('error', 'Error', data.message || 'Could not delete vehicle.');
      }
    } catch {
      showToast('error', 'Error', 'Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  const displayPhoto = photoUri || existingPhotoUrl;

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
          <CenteredHeader title="Edit Vehicle" titleColor={colors.textPrimary} />

          {/* Vehicle Photo */}
          <Text style={styles.label}>Vehicle Photo:</Text>
          <View style={styles.photoBoxWrapper}>
            <Pressable style={displayPhoto ? styles.photoPreview : styles.photoBox} onPress={pickImage}>
              {displayPhoto ? (
                <>
                  <Image source={{ uri: displayPhoto }} style={styles.photoImg} />
                  <View style={styles.photoOverlay}>
                    <MaterialCommunityIcons name="camera-outline" size={20} color={colors.white} />
                  </View>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.purpleLight} />
                  <Text style={styles.photoText}>Add Photo</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Make Picker */}
          <Text style={styles.label}>Make:</Text>
          <Pressable style={styles.pickerBtn} onPress={() => setShowMakePicker(true)}>
            <Text style={[styles.pickerBtnText, selectedMake && styles.pickerBtnTextSelected]}>
              {selectedMake ? selectedMake.name : 'Select Make'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
          </Pressable>

          {/* Model Picker */}
          <Text style={styles.label}>Model:</Text>
          <Pressable
            style={[styles.pickerBtn, !selectedMake && styles.pickerBtnDisabled]}
            onPress={() => { if (selectedMake) setShowModelPicker(true); }}
          >
            <Text style={[styles.pickerBtnText, selectedModel && styles.pickerBtnTextSelected]}>
              {selectedModel ? selectedModel.name : 'Select Model'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
          </Pressable>

          {/* Color */}
          <Text style={styles.label}>Color:</Text>
          <FormInput icon="palette-outline" placeholder="Silver" value={color} onChangeText={setColor} />

          {/* Year & Nickname */}
          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Year:</Text>
              <FormInput icon="calendar" placeholder="YYYY" value={year} onChangeText={setYear} keyboardType="numeric" />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Nickname:</Text>
              <FormInput icon="tag-outline" placeholder="My Sedan" value={nickname} onChangeText={setNickname} />
            </View>
          </View>

          {/* Delete Button */}
          <Pressable style={styles.deleteBtn} onPress={() => setShowDeleteModal(true)}>
            <Text style={styles.deleteBtnText}>Delete</Text>
          </Pressable>

          {/* Save Button */}
          <Pressable onPress={handleSave} disabled={saving} style={{ marginTop: Spacing.sm }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </LinearGradient>
          </Pressable>

          <View style={{ height: androidTabOffset + 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker Modals */}
      <PickerModal visible={showMakePicker} title="Select Make" items={makes.map((m) => ({ id: m.make_id, label: m.name }))} selectedId={selectedMake?.make_id} onSelect={handleSelectMake} onClose={() => setShowMakePicker(false)} />
      <PickerModal visible={showModelPicker} title="Select Model" items={models.map((m) => ({ id: m.model_id, label: m.name }))} selectedId={selectedModel?.model_id} onSelect={handleSelectModel} onClose={() => setShowModelPicker(false)} />

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Are you sure you want to delete your vehicle?</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalDeleteBtn} onPress={handleDelete} disabled={deleting}>
                {deleting ? <ActivityIndicator color={colors.pink} size="small" /> : <Text style={styles.modalDeleteText}>Delete</Text>}
              </Pressable>
              <Pressable style={styles.modalCancelBtn} onPress={() => setShowDeleteModal(false)}>
                <LinearGradient colors={[colors.purpleDark, colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalCancelGradient}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: 20 },

  label: { color: colors.textPrimary, fontSize: FontSizes.sm, fontFamily: Fonts.medium, marginBottom: Spacing.xs, marginTop: Spacing.sm },

  // Photo
  photoBoxWrapper: { alignItems: 'center', marginBottom: Spacing.md },
  photoBox: {
    width: 200, height: 150, borderRadius: BorderRadius.md,
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.cardBorder,
    justifyContent: 'center', alignItems: 'center',
  },
  photoPreview: {
    width: 200, height: 150, borderRadius: BorderRadius.md,
    overflow: 'hidden', position: 'relative',
  },
  photoImg: { width: '100%', height: '100%', borderRadius: BorderRadius.md },
  photoOverlay: {
    position: 'absolute', bottom: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14, padding: 4,
  },
  photoText: { color: colors.purpleLight, fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4 },

  // Row
  row: { flexDirection: 'row', gap: Spacing.md },
  halfCol: { flex: 1 },

  // Picker
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14, marginBottom: Spacing.xs,
  },
  pickerBtnDisabled: { opacity: 0.5 },
  pickerBtnText: { color: colors.textMuted, fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  pickerBtnTextSelected: { color: colors.textPrimary },

  // Delete
  deleteBtn: { borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.md },
  deleteBtnText: { color: colors.pink, fontFamily: Fonts.medium, fontSize: FontSizes.md },

  // Save
  saveBtn: { paddingVertical: 16, borderRadius: BorderRadius.lg, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  modalCard: { backgroundColor: colors.backgroundSecondary, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: Spacing.xl, width: '100%' },
  modalTitle: { color: colors.textPrimary, fontFamily: Fonts.semiBold, fontSize: FontSizes.md, textAlign: 'center', marginBottom: Spacing.xl },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalDeleteBtn: { flex: 1, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingVertical: 14, alignItems: 'center' },
  modalDeleteText: { color: colors.pink, fontFamily: Fonts.medium, fontSize: FontSizes.md },
  modalCancelBtn: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  modalCancelGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: BorderRadius.lg },
  modalCancelText: { color: colors.white, fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
