import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Image, ActivityIndicator, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import { API_URL } from '@/constants/config';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

// Duration tiers
const DURATION_TIERS = [
  { days: 7,  label: '7 Days',  price: 250,  desc: 'Short campaign' },
  { days: 14, label: '14 Days', price: 500,  desc: 'Most popular' },
  { days: 30, label: '30 Days', price: 1000, desc: 'Best value' },
] as const;

type DurationDays = 7 | 14 | 30;

type SelectableItem = { id: number; name: string; image_url?: string | null };

async function uploadAdImage(base64File: string): Promise<string> {
  const filename = `ad-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
  
  const { error } = await supabase.storage
    .from('ad-images')
    .upload(filename, decode(base64File), { contentType: 'image/jpeg' });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from('ad-images').getPublicUrl(filename);
  return data.publicUrl;
}

export default function CreateAdScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();

  const isVendor = user?.role === 'vendor';
  const isProvider = user?.role === 'provider';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<DurationDays>(14);
  const [uploading, setUploading] = useState(false);

  // Targeting state
  const [myItems, setMyItems] = useState<SelectableItem[]>([]);
  const [categories, setCategories] = useState<SelectableItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const selectedTier = DURATION_TIERS.find((t) => t.days === selectedDuration)!;

  // Fetch user's items and categories
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoadingItems(true);
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      try {
        if (isVendor && user?.vendor_id) {
          // Fetch vendor's products
          const [prodRes, catRes] = await Promise.all([
            fetch(`${API_URL}/products?vendor_id=${user.vendor_id}&pageSize=100`, { headers }),
            fetch(`${API_URL}/products/categories`, { headers }),
          ]);
          const prodData = await prodRes.json();
          const catData = await catRes.json();

          if (prodData.success) {
            setMyItems(
              (prodData.data || []).map((p: any) => ({
                id: p.product_id,
                name: p.name,
                image_url: p.image_url,
              }))
            );
          }
          if (catData.success) {
            setCategories(
              (catData.data || []).map((c: any) => ({
                id: c.category_id,
                name: c.name,
              }))
            );
          }
        } else if (isProvider) {
          // Fetch provider's services
          const [servRes, catRes] = await Promise.all([
            fetch(`${API_URL}/services/me?pageSize=100`, { headers }),
            fetch(`${API_URL}/services/categories`, { headers }),
          ]);
          const servData = await servRes.json();
          const catData = await catRes.json();

          if (servData.success) {
            setMyItems(
              (servData.data || []).map((s: any) => ({
                id: s.service_id,
                name: s.name,
                image_url: s.image_url,
              }))
            );
          }
          if (catData.success) {
            setCategories(
              (catData.data || []).map((c: any) => ({
                id: c.service_category_id,
                name: c.name,
              }))
            );
          }
        }
      } catch {
        // Silently fail — selectors will just be empty
      } finally {
        setLoadingItems(false);
      }
    };
    fetchData();
  }, [token, isVendor, isProvider, user?.vendor_id]);

  const toggleItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
      aspect: [16, 9],
      base64: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const handleConfirm = async () => {
    if (!imageUri) {
      showToast('warning', 'Image Required', 'Please upload a banner image for your ad.');
      return;
    }

    try {
      setUploading(true);
      let bannerUrl: string | null = null;

      try {
        if (!imageBase64) throw new Error("Image base64 data is missing.");
        bannerUrl = await uploadAdImage(imageBase64);
      } catch (error: any) {
        const msg = error.message || String(error);
        showToast('warning', 'Upload Issue', `Could not upload image: ${msg}`);
        bannerUrl = null;
      }

      // Build targeting params
      const targetProductIds = isVendor ? selectedItemIds : [];
      const targetServiceIds = isProvider ? selectedItemIds : [];
      const targetCategoryIds = selectedCategoryIds;

      // Navigate to payment with params
      router.push({
        pathname: '/ad-payment' as any,
        params: {
          banner_image_url: bannerUrl || '',
          title: title.trim(),
          duration_days: String(selectedDuration),
          price: String(selectedTier.price),
          target_product_ids: JSON.stringify(targetProductIds),
          target_service_ids: JSON.stringify(targetServiceIds),
          target_category_ids: JSON.stringify(targetCategoryIds),
        },
      });
    } finally {
      setUploading(false);
    }
  };

  const itemLabel = isVendor ? 'Products' : 'Services';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <CenteredHeader title="Create Ad" titleColor={colors.textPrimary} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Step 1 — Banner Image */}
        <Text style={[styles.stepLabel, { color: colors.textMuted }]}>STEP 1</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Banner Image</Text>
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
          This image will be shown in the slideshow on the home screen (16:9 ratio recommended).
        </Text>

        <Pressable
          style={[styles.imagePicker, {
            backgroundColor: colors.backgroundSecondary,
            borderColor: imageUri ? colors.pink : colors.cardBorder,
          }]}
          onPress={pickImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePickerEmpty}>
              <MaterialCommunityIcons name="image-plus" size={40} color={colors.textMuted} />
              <Text style={[styles.imagePickerText, { color: colors.textMuted }]}>
                Tap to upload banner
              </Text>
            </View>
          )}
          {imageUri && (
            <View style={[styles.changeImageOverlay]}>
              <MaterialCommunityIcons name="pencil" size={18} color="#fff" />
              <Text style={styles.changeImageText}>Change</Text>
            </View>
          )}
        </Pressable>

        {/* Step 2 — Title (optional) */}
        <Text style={[styles.stepLabel, { color: colors.textMuted, marginTop: Spacing.xl }]}>STEP 2</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Title <Text style={[styles.optional, { color: colors.textMuted }]}>(Optional)</Text>
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
          A label to help you identify this ad in your promotions list.
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Summer Oil Change Promo"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.cardBorder,
            color: colors.textPrimary,
          }]}
          maxLength={80}
        />

        {/* Step 3 — Targeting */}
        <Text style={[styles.stepLabel, { color: colors.textMuted, marginTop: Spacing.xl }]}>STEP 3</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Target Audience</Text>
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
          Choose which {itemLabel.toLowerCase()} or categories appear when a customer taps your ad. You can pick specific {itemLabel.toLowerCase()}, categories, or both.
        </Text>

        {loadingItems ? (
          <ActivityIndicator color={colors.pink} style={{ marginVertical: Spacing.md }} />
        ) : (
          <>
            {/* Specific items */}
            <Text style={[styles.subHeading, { color: colors.textPrimary }]}>
              My {itemLabel}
              {selectedItemIds.length > 0 && (
                <Text style={{ color: colors.pink }}> ({selectedItemIds.length} selected)</Text>
              )}
            </Text>
            {myItems.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                You have no {itemLabel.toLowerCase()} yet. Create some first!
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {myItems.map((item) => {
                  const selected = selectedItemIds.includes(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.pinkGlow : colors.backgroundSecondary,
                          borderColor: selected ? colors.pink : colors.cardBorder,
                        },
                      ]}
                      onPress={() => toggleItem(item.id)}
                    >
                      {selected && (
                        <MaterialCommunityIcons name="check-circle" size={16} color={colors.pink} />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? colors.pink : colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Categories */}
            <Text style={[styles.subHeading, { color: colors.textPrimary, marginTop: Spacing.md }]}>
              Categories
              {selectedCategoryIds.length > 0 && (
                <Text style={{ color: colors.pink }}> ({selectedCategoryIds.length} selected)</Text>
              )}
            </Text>
            {categories.length === 0 ? (
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                No categories available.
              </Text>
            ) : (
              <View style={styles.chipWrap}>
                {categories.map((cat) => {
                  const selected = selectedCategoryIds.includes(cat.id);
                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: selected ? colors.pinkGlow : colors.backgroundSecondary,
                          borderColor: selected ? colors.pink : colors.cardBorder,
                        },
                      ]}
                      onPress={() => toggleCategory(cat.id)}
                    >
                      {selected && (
                        <MaterialCommunityIcons name="check-circle" size={16} color={colors.pink} />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          { color: selected ? colors.pink : colors.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {selectedItemIds.length === 0 && selectedCategoryIds.length === 0 && (
              <View style={[styles.noTargetBanner, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                <MaterialCommunityIcons name="information-outline" size={18} color={colors.textMuted} />
                <Text style={[styles.noTargetText, { color: colors.textMuted }]}>
                  No targeting selected — customers will see all your {itemLabel.toLowerCase()} when they tap the ad.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Step 4 — Duration */}
        <Text style={[styles.stepLabel, { color: colors.textMuted, marginTop: Spacing.xl }]}>STEP 4</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose Duration</Text>
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
          Select how long your ad will appear on the home screen after approval.
        </Text>

        <View style={styles.tiersContainer}>
          {DURATION_TIERS.map((tier) => {
            const isSelected = selectedDuration === tier.days;
            const isPopular = tier.days === 14;
            return (
              <Pressable
                key={tier.days}
                style={[
                  styles.tierCard,
                  {
                    backgroundColor: isSelected ? colors.pinkGlow : colors.backgroundSecondary,
                    borderColor: isSelected ? colors.pink : colors.cardBorder,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedDuration(tier.days)}
              >
                {isPopular && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.pink }]}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}
                <View style={styles.tierRadio}>
                  <MaterialCommunityIcons
                    name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                    size={20}
                    color={isSelected ? colors.pink : colors.textMuted}
                  />
                </View>
                <Text style={[styles.tierLabel, { color: colors.textPrimary }]}>{tier.label}</Text>
                <Text style={[styles.tierDesc, { color: colors.textMuted }]}>{tier.desc}</Text>
                <Text style={[styles.tierPrice, { color: isSelected ? colors.pink : colors.textPrimary }]}>
                  {tier.price.toLocaleString('en-EG')} EGP
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Ad Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Duration</Text>
            <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>{selectedTier.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Targeting</Text>
            <Text style={[styles.summaryVal, { color: colors.textPrimary }]}>
              {selectedItemIds.length > 0 || selectedCategoryIds.length > 0
                ? `${selectedItemIds.length} ${itemLabel.toLowerCase()}, ${selectedCategoryIds.length} categories`
                : `All ${itemLabel.toLowerCase()}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textMuted }]}>Total</Text>
            <Text style={[styles.summaryVal, { color: colors.pink }]}>
              {selectedTier.price.toLocaleString('en-EG')} EGP
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: colors.background }]}>
        <Pressable
          onPress={handleConfirm}
          disabled={uploading}
          style={styles.confirmBtn}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.confirmGradient, uploading && { opacity: 0.6 }]}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.confirmText}>Confirm & Pay</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  stepLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
    marginBottom: 4,
  },
  optional: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  sectionDesc: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },

  imagePicker: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  imagePickerEmpty: { alignItems: 'center', gap: Spacing.sm },
  imagePickerText: { fontFamily: Fonts.medium, fontSize: FontSizes.sm },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  changeImageText: { color: '#fff', fontFamily: Fonts.medium, fontSize: FontSizes.sm },

  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
  },

  // Targeting
  subHeading: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  emptyHint: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  chipScroll: { marginBottom: Spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: Spacing.xs,
  },
  chipText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    maxWidth: 140,
  },
  noTargetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  noTargetText: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.xs,
    flex: 1,
    lineHeight: 18,
  },

  tiersContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tierCard: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    alignItems: 'center',
    position: 'relative',
    paddingTop: Spacing.lg,
  },
  tierRadio: { marginBottom: Spacing.xs },
  tierLabel: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: 2 },
  tierDesc: { fontFamily: Fonts.regular, fontSize: FontSizes.xs, marginBottom: Spacing.xs },
  tierPrice: { fontFamily: Fonts.extraBold, fontSize: FontSizes.lg },
  popularBadge: {
    position: 'absolute',
    top: -10,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  popularText: { color: '#fff', fontFamily: Fonts.semiBold, fontSize: 10 },

  summaryCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  summaryTitle: { fontFamily: Fonts.bold, fontSize: FontSizes.md, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryKey: { fontFamily: Fonts.regular, fontSize: FontSizes.sm },
  summaryVal: { fontFamily: Fonts.semiBold, fontSize: FontSizes.sm },

  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopWidth: 1,
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  confirmBtn: { borderRadius: BorderRadius.full, overflow: 'hidden' },
  confirmGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  confirmText: { color: '#fff', fontFamily: Fonts.bold, fontSize: FontSizes.md },
});
