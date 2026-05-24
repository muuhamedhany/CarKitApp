import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInLeft, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CenteredHeader, FormInput, GlassView, GradientButton, OutlinedButton } from '@/components';
import MapLocationPicker, { MapPickerResult } from '@/components/MapLocationPicker';
import { BorderRadius, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/hooks/useTheme';
import { BranchData, branchService } from '@/services/api';
import Text from '@/components/common/LocalizedText';

const { width } = Dimensions.get('window');

export default function BranchesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isMain, setIsMain] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await branchService.getMyBranches();
      if (res.success && res.data) {
        setBranches(res.data);
      } else {
        setBranches([]);
      }
    } catch (e) {
      console.log('Branch fetch error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleMapResult = useCallback((result: MapPickerResult) => {
    if (result.street) {
      setAddress(result.street + (result.city ? `, ${result.city}` : ''));
    }
    setLatitude(result.latitude);
    setLongitude(result.longitude);
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !address.trim() || latitude === null || longitude === null) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return showToast('error', 'Missing Fields', 'Please complete all fields and pin location on the map.');
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const branchData: Partial<BranchData> = {
        name,
        address,
        phone: phone.trim() || null,
        is_main: isMain,
        latitude,
        longitude,
      };

      let res;
      if (editingId) {
        res = await branchService.updateBranch(editingId, branchData);
      } else {
        res = await branchService.addBranch(branchData);
      }

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', editingId ? 'branches.saveSuccess' : 'branches.saveSuccess', editingId ? 'Branch updated successfully.' : 'New branch added successfully.');
        setIsAdding(false);
        setEditingId(null);
        setName(''); setAddress(''); setPhone('');
        setIsMain(false); setLatitude(null); setLongitude(null);
        fetchBranches();
      } else {
        showToast('error', 'Failed', res.message || 'Could not save branch.');
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (b: BranchData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(b.branch_id || null);
    setName(b.name || '');
    setAddress(b.address || '');
    setPhone(b.phone || '');
    setIsMain(!!b.is_main);
    setLatitude(b.latitude || null);
    setLongitude(b.longitude || null);
    setIsAdding(true);
  };

  const handleDelete = async (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await branchService.deleteBranch(id);
      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', 'branches.deleteSuccess', 'Branch deleted successfully.');
        fetchBranches();
      } else {
        showToast('error', 'Failed', res.message || 'Could not delete branch.');
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Something went wrong.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />

      {isDark && (
        <>
          <View style={[styles.orb, { top: -50, right: -100, backgroundColor: colors.pink + '15' }]} />
          <View style={[styles.orb, { bottom: 100, left: -150, backgroundColor: colors.purple + '10' }]} />
        </>
      )}

      {isAdding ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <CenteredHeader
            title={editingId ? 'branches.edit' : 'branches.add'}
            titleColor={colors.textPrimary}
            rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
            onBackPress={() => {
              setIsAdding(false);
              setEditingId(null);
              setName(''); setAddress(''); setPhone('');
              setIsMain(false); setLatitude(null); setLongitude(null);
            }}
          />

          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={[styles.glassCard, { borderColor: colors.cardBorder }]}>
            <View style={styles.formSection}>
              <FormInput
                label="branches.nameLabel"
                placeholder="branches.namePlaceholder"
                value={name}
                onChangeText={setName}
              />

              <FormInput
                label="branches.phoneLabel"
                placeholder="branches.phonePlaceholder"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              {/* Location Picker Row */}
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>LOCATION</Text>
                <GlassView intensity={10} tint={isDark ? 'dark' : 'light'} style={[styles.mapPickerBtn, { borderColor: colors.cardBorder }]}>
                  <Pressable
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowMapPicker(true); }}
                    style={({ pressed }) => [styles.mapPickerInner, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={[styles.mapPickerIconWrap, { backgroundColor: colors.pink + '15' }]}>
                      <MaterialCommunityIcons
                        name={latitude !== null ? "map-marker-check" : "map-marker-radius"}
                        size={24}
                        color={colors.pink}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.sm, color: colors.textPrimary }}>
                        {latitude !== null ? 'branches.locationSelected' : 'branches.locationSelect'}
                      </Text>
                      {latitude !== null && (
                        <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.xs, color: colors.textSecondary, marginTop: 2 }}>
                          Lat: {latitude.toFixed(5)}, Lng: {longitude?.toFixed(5)}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                </GlassView>
              </View>

              <FormInput
                label="branches.addressLabel"
                placeholder="branches.addressPlaceholder"
                value={address}
                onChangeText={setAddress}
              />

              {/* Switch for Main Branch */}
              <View style={[styles.switchRow, { borderColor: colors.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: Fonts.bold, fontSize: FontSizes.md, color: colors.textPrimary }}>
                    {isMain ? 'Yes' : 'No'}
                  </Text>
                  <Text style={{ fontFamily: Fonts.medium, fontSize: FontSizes.xs, color: colors.textSecondary, marginTop: 2 }}>
                    branches.isMainLabel
                  </Text>
                </View>
                <Switch
                  value={isMain}
                  onValueChange={setIsMain}
                  trackColor={{ false: colors.cardBorder, true: colors.pink }}
                  thumbColor={Platform.OS === 'android' ? (isMain ? '#FFF' : '#AAA') : undefined}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <GradientButton
              title="common.save"
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: Spacing.xl }}
              icon="content-save-outline"
            />
            <OutlinedButton
              title="common.cancel"
              onPress={() => {
                setIsAdding(false);
                setEditingId(null);
                setName(''); setAddress(''); setPhone('');
                setIsMain(false); setLatitude(null); setLongitude(null);
              }}
              style={{ marginTop: Spacing.md }}
              textColor={colors.textMuted}
            />
          </Animated.View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <CenteredHeader
            title="branches.title"
            titleColor={colors.textPrimary}
            rowStyle={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 20 }}
          />

          {branches.length === 0 ? (
            <Animated.View entering={FadeInDown} style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.pink + '10' }]}>
                <MaterialCommunityIcons name="map-marker-multiple-outline" size={64} color={colors.pink} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>branches.noBranches</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>branches.noBranchesSub</Text>
            </Animated.View>
          ) : (
            branches.map((b, index) => (
              <Animated.View
                key={b.branch_id}
                entering={FadeInLeft.delay(index * 100).springify()}
                layout={Layout.springify()}
              >
                <GlassView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={styles.branchCard}>
                  <View style={styles.cardInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                      <MaterialCommunityIcons name="map-marker" size={20} color={colors.pink} />
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>{b.name}</Text>
                      {b.is_main && (
                        <View style={[styles.mainBadge, { backgroundColor: colors.pink + '20', borderColor: colors.pink }]}>
                          <Text style={{ fontSize: 9, fontFamily: Fonts.bold, color: colors.pink }}>MAIN</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.cardAddress, { color: colors.textSecondary }]}>
                      {b.address}
                    </Text>
                    {b.phone && (
                      <Text style={[styles.cardSubText, { color: colors.textMuted }]}>
                        Tel: {b.phone}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleEdit(b)}
                    style={styles.editBtn}
                  >
                    <View style={[styles.editIconWrap, { backgroundColor: colors.pink + '15' }]}>
                      <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.pink} />
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(b.branch_id!)}
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

          <Animated.View entering={FadeInDown.delay(branches.length * 100).springify()}>
            <GradientButton
              title="branches.add"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditingId(null);
                setName(''); setAddress(''); setPhone('');
                setIsMain(false); setLatitude(null); setLongitude(null);
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
  mapPickerBtn: {
    borderWidth: 1, borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  mapPickerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  mapPickerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },

  branchCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, letterSpacing: 0.5 },
  cardAddress: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 4, opacity: 0.8 },
  cardSubText: { fontFamily: Fonts.medium, fontSize: FontSizes.xs, marginTop: 2, opacity: 0.6 },
  mainBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  editBtn: { padding: Spacing.xs },
  editIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  deleteBtn: { padding: Spacing.xs },
  deleteIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },

  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyIconWrap: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg },
  emptyTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.xl, marginTop: Spacing.md, textAlign: 'center' },
  emptySubtitle: { fontFamily: Fonts.medium, fontSize: FontSizes.sm, marginTop: 8, textAlign: 'center', opacity: 0.6, maxWidth: 260 },
});
