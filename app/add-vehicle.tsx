import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { API_URL } from '@/constants/config';
import { Colors, Fonts, FontSizes, Spacing, BorderRadius } from '@/constants/theme';

type Make = { make_id: number; name: string };
type Model = { model_id: number; name: string; make_id_fk: number };

export default function AddVehicleScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [makes, setMakes] = useState<Make[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedMake, setSelectedMake] = useState<Make | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [nickname, setNickname] = useState('');
  const [showMakePicker, setShowMakePicker] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch makes
  useEffect(() => {
    const fetchMakes = async () => {
      try {
        const res = await fetch(`${API_URL}/vehicles/makes`);
        const data = await res.json();
        if (data.success) setMakes(data.data);
      } catch {}
    };
    fetchMakes();
  }, []);

  // Fetch models when make changes
  useEffect(() => {
    if (!selectedMake) { setModels([]); return; }
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_URL}/vehicles/makes/${selectedMake.make_id}/models`);
        const data = await res.json();
        if (data.success) setModels(data.data);
      } catch {}
    };
    fetchModels();
  }, [selectedMake]);

  const handleSave = async () => {
    if (!selectedModel) {
      showToast('warning', 'Missing Info', 'Please select a make and model.');
      return;
    }
    if (!year.trim()) {
      showToast('warning', 'Missing Info', 'Please enter the year.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model_id_fk: selectedModel.model_id,
          year: parseInt(year),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Vehicle Added!', 'Your vehicle has been saved.');
        router.back();
      } else {
        showToast('error', 'Error', data.message || 'Could not save vehicle.');
      }
    } catch {
      showToast('error', 'Error', 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Add New Vehicle</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Photo */}
          <Text style={styles.label}>Vehicle Photo:</Text>
          <Pressable style={styles.photoBox}>
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color={Colors.pink} />
            <Text style={styles.photoText}>Add Photo</Text>
          </Pressable>

          {/* Make Picker */}
          <Text style={styles.label}>Make:</Text>
          <Pressable
            style={styles.pickerBtn}
            onPress={() => { setShowMakePicker(!showMakePicker); setShowModelPicker(false); }}
          >
            <Text style={[styles.pickerText, !selectedMake && styles.placeholderText]}>
              {selectedMake?.name || 'Select Make'}
            </Text>
            <MaterialCommunityIcons
              name={showMakePicker ? 'chevron-up' : 'chevron-down'}
              size={22} color={Colors.textMuted}
            />
          </Pressable>
          {showMakePicker && (
            <View style={styles.dropdownList}>
              {makes.length === 0 ? (
                <Text style={styles.dropdownEmpty}>No makes available</Text>
              ) : (
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {makes.map(make => (
                    <Pressable
                      key={make.make_id}
                      style={[styles.dropdownItem, selectedMake?.make_id === make.make_id && styles.dropdownItemActive]}
                      onPress={() => {
                        setSelectedMake(make);
                        setSelectedModel(null);
                        setShowMakePicker(false);
                      }}
                    >
                      <Text style={[styles.dropdownText, selectedMake?.make_id === make.make_id && styles.dropdownTextActive]}>
                        {make.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Model Picker */}
          <Text style={styles.label}>Model:</Text>
          <Pressable
            style={[styles.pickerBtn, !selectedMake && styles.pickerDisabled]}
            onPress={() => { if (selectedMake) { setShowModelPicker(!showModelPicker); setShowMakePicker(false); } }}
          >
            <Text style={[styles.pickerText, !selectedModel && styles.placeholderText]}>
              {selectedModel?.name || 'Select Model'}
            </Text>
            <MaterialCommunityIcons
              name={showModelPicker ? 'chevron-up' : 'chevron-down'}
              size={22} color={Colors.textMuted}
            />
          </Pressable>
          {showModelPicker && (
            <View style={styles.dropdownList}>
              {models.length === 0 ? (
                <Text style={styles.dropdownEmpty}>No models found</Text>
              ) : (
                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {models.map(model => (
                    <Pressable
                      key={model.model_id}
                      style={[styles.dropdownItem, selectedModel?.model_id === model.model_id && styles.dropdownItemActive]}
                      onPress={() => { setSelectedModel(model); setShowModelPicker(false); }}
                    >
                      <Text style={[styles.dropdownText, selectedModel?.model_id === model.model_id && styles.dropdownTextActive]}>
                        {model.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

          {/* Color */}
          <Text style={styles.label}>Color:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Red"
            placeholderTextColor={Colors.textMuted}
            value={color}
            onChangeText={setColor}
          />

          {/* Year + Nickname row */}
          <View style={styles.rowFields}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Year:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY"
                placeholderTextColor={Colors.textMuted}
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
            <View style={[styles.halfField, { marginLeft: Spacing.md }]}>
              <Text style={styles.label}>Nickname:</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Nickname"
                placeholderTextColor={Colors.textMuted}
                value={nickname}
                onChangeText={setNickname}
              />
            </View>
          </View>

          {/* Save Button */}
          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={loading}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.saveBtnText}>Save Vehicle</Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: Colors.white, fontSize: FontSizes.lg, fontFamily: Fonts.bold },
  label: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.medium,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoBox: {
    width: 180,
    height: 130,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  photoText: {
    color: Colors.pink,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.medium,
    marginTop: 4,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  pickerDisabled: { opacity: 0.5 },
  pickerText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
  },
  placeholderText: { color: Colors.textMuted },
  dropdownList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: { backgroundColor: 'rgba(233,30,140,0.1)' },
  dropdownText: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
  },
  dropdownTextActive: { color: Colors.pink, fontFamily: Fonts.semiBold },
  dropdownEmpty: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    padding: 16,
    textAlign: 'center',
  },
  textInput: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
  },
  rowFields: {
    flexDirection: 'row',
  },
  halfField: {
    flex: 1,
  },
  saveBtn: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  saveBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
});
