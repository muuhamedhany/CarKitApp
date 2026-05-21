import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter,
  useLocalSearchParams } from 'expo-router';

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
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, FormInput, GlassView, GradientButton, OutlinedButton } from '@/components';
import MapLocationPicker, { MapPickerResult } from '@/components/MapLocationPicker';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { AddressData, addressService } from '@/services/api';
import Text from '@/components/common/LocalizedText';

const { width, height } = Dimensions.get('window');

export default function AddressesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
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
  const [apartmentFloor, setApartmentFloor] = useState('');
  const [building, setBuilding] = useState('');
  const [notes, setNotes] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  const { add } = useLocalSearchParams();

  useEffect(() => {
    if (add === 'true') {
      setIsAdding(true);
    }
  }, [add]);

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return showToast('error', 'Missing Fields', 'Please complete all fields.');
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const addressData: AddressData = {
        title,
        street,
        city,
        apartment_floor: apartmentFloor,
        building,
        notes,
        ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
      };

      let res;
      if (editingId) {
        res = await addressService.updateAddress(editingId.toString(), addressData);
      } else {
        res = await addressService.addAddress(addressData);
      }

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', editingId ? 'Address Updated' : 'Address Saved', editingId ? 'Address updated successfully.' : 'New address added successfully.');
        setIsAdding(false);
        setEditingId(null);
        setTitle(''); setStreet(''); setCity('');
        setApartmentFloor(''); setBuilding(''); setNotes('');
        setLatitude(null); setLongitude(null);
        fetchAddresses();
      } else {
        showToast('error', 'Failed', res.message || 'Could not save address.');
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (addr: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(addr.address_id || addr.id);
    setTitle(addr.title || '');
    setStreet(addr.street || '');
    setCity(addr.city || '');
    setApartmentFloor(addr.apartment_floor || '');
    setBuilding(addr.building || '');
    setNotes(addr.notes || '');
    setLatitude(addr.latitude || null);
    setLongitude(addr.longitude || null);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await addressService.deleteAddress(id);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', 'Deleted', 'Address removed.');
        fetchAddresses();
      }
    } catch (e) {
      showToast('error', 'Error', 'Could not delete address.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.orb, { top: -100, left: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, right: -150, backgroundColor: colors.purple + '10' }]} />



      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.pink} />
        </View>
      ) : isAdding ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <CenteredHeader
            title={isAdding ? (editingId ? 'Edit Address' : 'Add Address') : 'Addresses'}
            titleColor={colors.textPrimary}
            rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
          />
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowMapPicker(true);
                }}
                style={styles.mapPickerBtn}
              >
                <View style={styles.mapPickerInner}>
                  <View style={[styles.mapPickerIconWrap, { backgroundColor: colors.pink + '20' }]}>
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
                <View style={[styles.coordsBadge, { backgroundColor: colors.pink + '15' }]}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={14} color={colors.pink} />
                  <Text style={[styles.coordsBadgeText, { color: colors.pink }]}>
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </Text>
                </View>
              )}
            </GlassView>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={styles.formSection}>
              <FormInput
                label="Title (e.g. Home, Work)"
                icon="label-outline"
                placeholder="Ex. Home"
                value={title}
                onChangeText={setTitle}
              />

              <FormInput
                label="Street Address"
                placeholder="123 Main St, Apt 4B"
                value={street}
                onChangeText={setStreet}
              />

              <FormInput
                label="City"
                placeholder="Ex. Cairo"
                value={city}
                onChangeText={setCity}
              />

              <View style={{ flexDirection: 'row', gap: Spacing.md }}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Building"
                    placeholder="Ex. 42"
                    value={building}
                    onChangeText={setBuilding}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Apt / Floor"
                    placeholder="Ex. Apt 4, Floor 2"
                    value={apartmentFloor}
                    onChangeText={setApartmentFloor}
                  />
                </View>
              </View>

              <FormInput
                label="Delivery Notes (Optional)"
                placeholder="Ex. Gate code, ring bell twice..."
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <GradientButton
              title="Save Address"
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: Spacing.xl }}
              icon="content-save-outline"
            />
            <OutlinedButton
              title="Cancel"
              onPress={() => {
                setIsAdding(false);
                setEditingId(null);
                setTitle(''); setStreet(''); setCity('');
                setApartmentFloor(''); setBuilding(''); setNotes('');
                setLatitude(null); setLongitude(null);
              }}
              style={{ marginTop: Spacing.md }}
              textColor={colors.textMuted}
            />
          </Animated.View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <CenteredHeader
            title={isAdding ? (editingId ? 'Edit Address' : 'Add Address') : 'Addresses'}
            titleColor={colors.textPrimary}
            rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
          />
          {addresses.length === 0 ? (
            <Animated.View entering={FadeInDown} style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.pink + '10' }]}>
                <MaterialCommunityIcons name="map-marker-off" size={64} color={colors.pink} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No addresses yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>Add a shipping address to make checkout faster.</Text>
            </Animated.View>
          ) : (
            addresses.map((addr, index) => (
              <Animated.View
                key={addr.address_id || addr.id}
                entering={FadeInLeft.delay(index * 100).springify()}
                layout={Layout.springify()}
              >
                <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.addressCard}>
                  <View style={styles.cardInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <MaterialCommunityIcons name="map-marker" size={20} color={colors.pink} />
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{addr.title || 'Address'}</Text>
                    </View>
                    <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>
                      {addr.building ? `Bldg ${addr.building}, ` : ''}
                      {addr.street}, {addr.city}
                    </Text>
                    {addr.apartment_floor && (
                      <Text style={[styles.cardSubText, { color: colors.textMuted }]}>
                        Apartment/Floor: {addr.apartment_floor}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleEdit(addr)}
                    style={styles.editBtn}
                  >
                    <View style={[styles.editIconWrap, { backgroundColor: colors.pink + '15' }]}>
                      <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.pink} />
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(addr.address_id || addr.id)}
                    style={styles.deleteBtn}
                  >
                    <View style={[styles.deleteIconWrap, { backgroundColor: colors.error + '15' }]}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error} />
                    </View>
                  </Pressable>
                </GlassView>
              </Animated.View>
            ))
          )}

          <Animated.View entering={FadeInDown.delay(addresses.length * 100).springify()}>
            <GradientButton
              title="Add New Address"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditingId(null);
                setTitle(''); setStreet(''); setCity('');
                setApartmentFloor(''); setBuilding(''); setNotes('');
                setLatitude(null); setLongitude(null);
                setIsAdding(true);
              }}
              style={{ marginTop: Spacing.xl }}
              icon="plus"
            />
          </Animated.View>
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
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 100 },

  orb: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.4,
  },

  formSection: {
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  glassCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: Spacing.xl,
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

  addressCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, letterSpacing: 0.5 },
  cardAddress: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4, opacity: 0.8 },
  cardSubText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2, opacity: 0.6 },
  editBtn: { padding: Spacing.xs },
  editIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { padding: Spacing.xs },
  deleteIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIconWrap: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginTop: Spacing.md },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 8, textAlign: 'center', opacity: 0.6, maxWidth: 260 },

  mapPickerBtn: {
    padding: Spacing.sm,
  },
  mapPickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mapPickerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPickerTextWrap: {
    flex: 1,
  },
  mapPickerTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    letterSpacing: 0.5,
  },
  mapPickerSubtitle: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    marginTop: 4,
    opacity: 0.6,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  coordsBadgeText: {
    fontFamily: Fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

