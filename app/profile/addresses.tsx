import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import MapLocationPicker, { MapPickerResult } from '@/components/MapLocationPicker';
import { addressService, AddressData } from '@/services/api';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function AddressesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await addressService.getAddresses();
      if (res.success) {
        setAddresses(res.data);
      }
    } catch (e) {
      console.log('Address fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleMapResult = useCallback((result: MapPickerResult) => {
    if (result.street) setStreet(result.street);
    if (result.city) setCity(result.city);
    setLatitude(result.latitude);
    setLongitude(result.longitude);
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !street.trim() || !city.trim()) {
      return showToast('error', 'Missing Fields', 'Please complete all fields.');
    }

    setSaving(true);
    try {
      const addressData: AddressData = {
        title,
        street,
        city,
        ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
      };
      const res = await addressService.addAddress(addressData);
      if (res.success) {
        showToast('success', 'Address Saved', 'New address added successfully.');
        setIsAdding(false);
        setTitle(''); setStreet(''); setCity('');
        setLatitude(null); setLongitude(null);
        fetchAddresses();
      } else {
        showToast('error', 'Failed', res.message || 'Could not add address.');
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await addressService.deleteAddress(id);
      if (res.success) {
        showToast('success', 'Deleted', 'Address removed.');
        fetchAddresses();
      }
    } catch (e) {
      showToast('error', 'Error', 'Could not delete address.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CenteredHeader
        title={isAdding ? 'Add Address' : 'Addresses'}
        titleColor={colors.textPrimary}
        rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : isAdding ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Pick from Map button */}
          <Pressable
            onPress={() => setShowMapPicker(true)}
            style={[styles.mapPickerBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.pink }]}
          >
            <View style={styles.mapPickerInner}>
              <View style={[styles.mapPickerIconWrap, { backgroundColor: colors.pink + '18' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={24} color={colors.pink} />
              </View>
              <View style={styles.mapPickerTextWrap}>
                <Text style={[styles.mapPickerTitle, { color: colors.textPrimary }]}>Pick from Map</Text>
                <Text style={[styles.mapPickerSubtitle, { color: colors.textMuted }]}>
                  {latitude != null ? 'Location selected ✓  Tap to change' : 'Tap to open the map and pin your location'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
            </View>
          </Pressable>

          {latitude != null && longitude != null && (
            <View style={[styles.coordsBadge, { backgroundColor: colors.pink + '12' }]}>
              <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.pink} />
              <Text style={[styles.coordsBadgeText, { color: colors.pink }]}>
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </Text>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Title (e.g. Home, Work)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
              <MaterialCommunityIcons name="label-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Ex. Home"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>Street Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="123 Main St, Apt 4B"
                placeholderTextColor={colors.textMuted}
                value={street}
                onChangeText={setStreet}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>City</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="Ex. Cairo"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
          </View>

          <Pressable onPress={handleSave} disabled={saving} style={{ marginTop: Spacing.xl }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            >
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveBtnText}>Save Address</Text>}
            </LinearGradient>
          </Pressable>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="map-marker-off" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No addresses yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Add a shipping address to make checkout faster.</Text>
            </View>
          ) : (
            addresses.map(addr => (
              <View key={addr.address_id || addr.id} style={[styles.addressCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <View style={styles.cardInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                    <MaterialCommunityIcons name="map-marker" size={20} color={colors.pink} />
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{addr.title || 'Address'}</Text>
                  </View>
                  <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>{addr.street}, {addr.city}</Text>
                </View>
                <Pressable onPress={() => handleDelete(addr.address_id || addr.id)} style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
                </Pressable>
              </View>
            ))
          )}

          <Pressable onPress={() => setIsAdding(true)} style={{ marginTop: Spacing.xl }}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
              <Text style={styles.saveBtnText}>Add New Address</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      )}

      {/* Map Location Picker Modal */}
      <MapLocationPicker
        visible={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelected={handleMapResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: 40 },

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
    flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: 16, borderRadius: BorderRadius.lg,
  },
  saveBtnText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },

  addressCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, borderWidth: 1, borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.md },
  cardAddress: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4 },
  deleteBtn: { padding: Spacing.xs },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontFamily: Fonts.semiBold, fontSize: FontSizes.lg, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.regular, fontSize: FontSizes.sm, marginTop: 4, textAlign: 'center' },

  mapPickerBtn: {
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderStyle: 'dashed',
  },
  mapPickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mapPickerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPickerTextWrap: {
    flex: 1,
  },
  mapPickerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  mapPickerSubtitle: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  coordsBadgeText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
  },
});
