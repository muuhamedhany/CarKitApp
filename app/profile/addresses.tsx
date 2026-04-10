import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
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

  const handleSave = async () => {
    if (!title.trim() || !street.trim() || !city.trim()) {
      return showToast('error', 'Missing Fields', 'Please complete all fields.');
    }

    setSaving(true);
    try {
      const res = await addressService.addAddress({ title, street, city });
      if (res.success) {
        showToast('success', 'Address Saved', 'New address added successfully.');
        setIsAdding(false);
        setTitle(''); setStreet(''); setCity('');
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
                placeholder="Ex. Austin"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 40 },

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
});
