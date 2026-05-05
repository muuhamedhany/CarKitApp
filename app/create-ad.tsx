import { useState } from 'react';
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
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader } from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

// Duration tiers
const DURATION_TIERS = [
  { days: 7,  label: '7 Days',  price: 250,  desc: 'Short campaign' },
  { days: 14, label: '14 Days', price: 500,  desc: 'Most popular' },
  { days: 30, label: '30 Days', price: 1000, desc: 'Best value' },
] as const;

type DurationDays = 7 | 14 | 30;

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
  const insets = useSafeAreaInsets();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<DurationDays>(14);
  const [uploading, setUploading] = useState(false);

  const selectedTier = DURATION_TIERS.find((t) => t.days === selectedDuration)!;

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
        // If upload fails, continue with local URI — backend will store null
        const msg = error.message || String(error);
        showToast('warning', 'Upload Issue', `Could not upload image: ${msg}`);
        bannerUrl = null;
      }

      // Navigate to payment with params
      router.push({
        pathname: '/ad-payment' as any,
        params: {
          banner_image_url: bannerUrl || '',
          title: title.trim(),
          duration_days: String(selectedDuration),
          price: String(selectedTier.price),
        },
      });
    } finally {
      setUploading(false);
    }
  };

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

        {/* Step 3 — Duration */}
        <Text style={[styles.stepLabel, { color: colors.textMuted, marginTop: Spacing.xl }]}>STEP 3</Text>
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
