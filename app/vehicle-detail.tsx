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
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  const { colors, isDark } = useTheme();
  const { vehicleId } = useLocalSearchParams<{ vehicleId: string }>();
  const { token } = useAuth();
  const { showToast } = useToast();

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

      if (response.status < 200 || response.status >= 300) throw new Error('Upload failed');
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let photoUrl: string | null = existingPhotoUrl;
      if (photoUri) {
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const res = await fetch(`${API_URL}/vehicles/${vehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      <View style={styles.container}>
        <LinearGradient
          colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      </View>
    );
  }

  const displayPhoto = photoUri || existingPhotoUrl;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: -100, left: -150, backgroundColor: colors.purple + '10' }]} />

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
            <CenteredHeader title="Edit Vehicle" titleColor={colors.pink} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)}>
            <BlurView
              intensity={isDark ? 40 : 60}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.glassCard, Shadows.lg, { borderColor: colors.cardBorder }]}
            >
              {/* Vehicle Photo */}
              <View style={styles.section}>
                <Text style={[styles.label, { color: colors.textPrimary }]}>Vehicle Photo</Text>
                <Pressable
                  style={({ pressed }) => [
                    displayPhoto ? styles.photoPreview : styles.photoBox,
                    { borderColor: displayPhoto ? colors.pink : colors.cardBorder, opacity: pressed ? 0.8 : 1 }
                  ]}
                  onPress={pickImage}
                >
                  {displayPhoto ? (
                    <>
                      <Image source={{ uri: displayPhoto }} style={styles.photoImg} />
                      <View style={styles.photoOverlay}>
                        <MaterialCommunityIcons name="camera" size={20} color={colors.white} />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[styles.iconCircle, { backgroundColor: colors.pink + '15' }]}>
                        <MaterialCommunityIcons name="camera-plus" size={28} color={colors.pink} />
                      </View>
                      <Text style={[styles.photoText, { color: colors.textMuted }]}>Add Photo</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                <View style={styles.pickerGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Make</Text>
                  <Pressable
                    style={[styles.pickerBtn, { backgroundColor: colors.backgroundSecondary + '50', borderColor: colors.border }]}
                    onPress={() => setShowMakePicker(true)}
                  >
                    <Text style={[styles.pickerBtnText, { color: selectedMake ? colors.textPrimary : colors.textMuted }]}>
                      {selectedMake ? selectedMake.name : 'Select Make'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>

                <View style={styles.pickerGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Model</Text>
                  <Pressable
                    style={[
                      styles.pickerBtn,
                      { backgroundColor: colors.backgroundSecondary + '50', borderColor: colors.border },
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

                <FormInput label="Color" icon="palette-outline" placeholder="Silver" value={color} onChangeText={setColor} />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: Spacing.md }}>
                    <FormInput label="Year" icon="calendar" placeholder="YYYY" value={year} onChangeText={setYear} keyboardType="numeric" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <FormInput label="Nickname" icon="tag-outline" placeholder="My Sedan" value={nickname} onChangeText={setNickname} />
                  </View>
                </View>
              </View>

              <View style={styles.actionGroup}>
                <GradientButton
                  title={saving ? "Saving..." : "Save Changes"}
                  onPress={handleSave}
                  loading={saving}
                  style={styles.saveBtn}
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.deleteBtn,
                    { borderColor: colors.pink + '40', opacity: pressed ? 0.7 : 1 }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDeleteModal(true);
                  }}
                >
                  <Text style={[styles.deleteBtnText, { color: colors.pink }]}>Delete Vehicle</Text>
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerModal visible={showMakePicker} title="Select Make" items={makes.map((m) => ({ id: m.make_id, label: m.name }))} selectedId={selectedMake?.make_id} onSelect={handleSelectMake} onClose={() => setShowMakePicker(false)} />
      <PickerModal visible={showModelPicker} title="Select Model" items={models.map((m) => ({ id: m.model_id, label: m.name }))} selectedId={selectedModel?.model_id} onSelect={handleSelectModel} onClose={() => setShowModelPicker(false)} />

      {/* Delete Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <Animated.View entering={FadeInDown} style={styles.modalContent}>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={[styles.modalCard, { borderColor: colors.cardBorder }]}
            >
              <View style={styles.modalHeader}>
                <View style={[styles.warningIcon, { backgroundColor: colors.pink + '15' }]}>
                  <MaterialCommunityIcons name="alert-outline" size={32} color={colors.pink} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Delete Vehicle?</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  This action cannot be undone. All history for this vehicle will be removed.
                </Text>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirmBtn, { backgroundColor: colors.pink }]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.modalConfirmText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  glassCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, padding: Spacing.xl, overflow: 'hidden' },
  section: { alignItems: 'center', marginBottom: Spacing.xl },
  label: { fontSize: FontSizes.md, fontFamily: Fonts.bold, marginBottom: Spacing.md },
  photoBox: { width: '100%', height: 160, borderRadius: BorderRadius.xl, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  photoPreview: { width: '100%', height: 160, borderRadius: BorderRadius.xl, overflow: 'hidden', position: 'relative', borderWidth: 1 },
  photoImg: { width: '100%', height: '100%' },
  photoOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  photoText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  formContainer: { gap: Spacing.xs },
  inputLabel: { fontSize: 13, fontFamily: Fonts.bold, marginBottom: 6, marginLeft: 4, opacity: 0.8 },
  pickerGroup: { marginBottom: Spacing.sm },
  pickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: BorderRadius.lg, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: 14 },
  pickerBtnDisabled: { opacity: 0.4 },
  pickerBtnText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  rowInputs: { flexDirection: 'row', alignItems: 'center' },
  actionGroup: { marginTop: Spacing.xl, gap: Spacing.md },
  saveBtn: { width: '100%' },
  deleteBtn: { borderRadius: BorderRadius.lg, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  deleteBtnText: { fontFamily: Fonts.bold, fontSize: FontSizes.md },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { width: '100%', maxWidth: 400 },
  modalCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, overflow: 'hidden', padding: Spacing.xl },
  modalHeader: { alignItems: 'center', marginBottom: Spacing.xl },
  warningIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSizes.xl, fontFamily: Fonts.bold, marginBottom: 8 },
  modalSubtitle: { fontSize: FontSizes.md, fontFamily: Fonts.medium, textAlign: 'center', opacity: 0.7, lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: Spacing.md },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.lg, borderWidth: 1, alignItems: 'center' },
  modalCancelText: { fontFamily: Fonts.bold, fontSize: FontSizes.md },
  modalConfirmBtn: { flex: 1, paddingVertical: 14, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { color: 'white', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
