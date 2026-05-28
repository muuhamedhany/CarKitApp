import {
  useState,
  useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader, FormInput, GlassView} from '@/components';
import { Spacing, FontSizes, Fonts, BorderRadius, Shadows } from '@/constants/theme';
import Text from '@/components/common/LocalizedText';

const AD_TIERS = [
  { id: 1, name: 'Basic', duration: '7 Days', price: 250 },
  { id: 2, name: 'Pro', duration: '14 Days', price: 500 },
  { id: 3, name: 'Elite', duration: '30 Days', price: 1000 },
];

async function uploadAdImage(base64File: string): Promise<string> {
  const filename = `ad-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
  const { error } = await supabase.storage
    .from('ad-images')
    .upload(filename, decode(base64File), { contentType: 'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from('ad-images').getPublicUrl(filename);
  return data.publicUrl;
}

export default function CreateAdScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();


  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedTier, setSelectedTier] = useState(AD_TIERS[1]);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
      aspect: [3, 1],
      base64: true,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const handleCreateAd = async () => {
    if (!imageUri || !imageBase64) return;
    setSubmitting(true);
    try {
      const bannerUrl = await uploadAdImage(imageBase64);
      router.push({
        pathname: '/ad-payment' as any,
        params: {
          banner_image_url: bannerUrl,
          title,
          duration_days: selectedTier.duration.replace(/\D/g, ''),
          price: selectedTier.price,
        },
      });
    } catch (e) {
      showToast('error', 'Upload failed', 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ExpoLinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.orb, { top: -100, right: -100, backgroundColor: colors.pink + '15' }]} />
      <View style={[styles.orb, { bottom: 200, left: -150, backgroundColor: colors.purple + '10' }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CenteredHeader title="Create Ad" titleColor={colors.textPrimary} />
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Choose a Tier</Text>
        </Animated.View>
        
        <View style={styles.tierGrid}>
          {AD_TIERS.map((tier, idx) => {
            const selected = selectedTier?.id === tier.id;
            return (
              <Animated.View key={tier.id} entering={FadeInDown.delay(200 + idx * 100)} style={styles.tierItem}>
                <Pressable
                  style={[styles.tierCard, { borderColor: selected ? colors.pink : colors.cardBorder, borderWidth: selected ? 2 : 1 }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedTier(tier); }}
                >
                  <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={styles.tierBlur}>
                    {selected && <MaterialCommunityIcons name="check-circle" size={18} color={colors.pink} style={styles.checkIcon} />}
                    <Text style={[styles.tierName, { color: colors.textPrimary }]}>{tier.name}</Text>
                    <Text style={[styles.tierDuration, { color: colors.textSecondary }]}>{tier.duration}</Text>
                    <Text style={[styles.tierPrice, { color: colors.pink }]}>{tier.price} EGP</Text>
                  </GlassView>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInDown.delay(500)}>
          <GlassView intensity={isDark ? 20 : 40} tint={isDark ? 'dark' : 'light'} style={[styles.formCard, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginBottom: Spacing.sm }]}>Ad Details</Text>
            <FormInput
              label="Ad Title"
              placeholder="e.g. Summer Tire Sale"
              value={title}
              onChangeText={setTitle}
            />
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.sm }]}>Banner Asset</Text>
            <Text style={[styles.helperText, { color: colors.textSecondary, opacity: 0.7 }]}>Recommended size: 1200x400 (3:1 aspect ratio)</Text>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handlePickImage(); }}
              style={[styles.imageUpload, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', borderColor: colors.cardBorder, borderStyle: 'dashed' }]}
            >
              {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : (
                <View style={styles.uploadPlaceholder}>
                  <MaterialCommunityIcons name="image-plus" size={40} color={colors.pink} />
                  <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Upload Banner</Text>
                </View>
              )}
            </Pressable>
          </GlassView>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700)}>
          <GlassView intensity={isDark ? 30 : 60} tint={isDark ? 'dark' : 'light'} style={[styles.summaryCard, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Order Summary</Text>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Ad Plan:</Text><Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedTier?.name || 'None'}</Text></View>
            <View style={styles.summaryRow}><Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Duration:</Text><Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{selectedTier?.duration || '-'}</Text></View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}><Text style={[styles.totalLabel, { color: colors.textPrimary }]}>Total:</Text><Text style={[styles.totalValue, { color: colors.pink }]}>{selectedTier?.price || 0} EGP</Text></View>
          </GlassView>
        </Animated.View>
      </ScrollView>

      <Animated.View entering={FadeInUp.delay(900)} style={[styles.bottomBar, { borderTopColor: colors.cardBorder, backgroundColor: isDark ? 'rgba(5, 5, 5, 0.8)' : 'rgba(255,255,255,0.8)' }]}>
        <GlassView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.buttonBlur}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleCreateAd(); }}
            disabled={submitting || !title || !selectedTier || !imageUri}
            style={[styles.createButton, { backgroundColor: colors.pink, opacity: (submitting || !title || !selectedTier || !imageUri) ? 0.5 : 1 }]}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.createButtonText}>Proceed to Payment</Text>}
          </Pressable>
        </GlassView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, opacity: 0.5 },
  content: { padding: Spacing.md, paddingBottom: 160 },
  sectionTitle: { fontFamily: Fonts.extraBold, fontSize: 22, marginBottom: Spacing.md, letterSpacing: -0.5 },
  tierGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
  tierItem: { width: '31%' },
  tierCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadows.sm },
  tierBlur: { padding: Spacing.md, alignItems: 'center' },
  checkIcon: { position: 'absolute', top: 4, right: 4 },
  tierName: { fontFamily: Fonts.bold, fontSize: 14, marginBottom: 2 },
  tierDuration: { fontFamily: Fonts.medium, fontSize: 11, marginBottom: 4 },
  tierPrice: { fontFamily: Fonts.extraBold, fontSize: 13 },
  formCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, padding: Spacing.xl, marginBottom: Spacing.xl, overflow: 'hidden', ...Shadows.md },
  inputLabel: { fontFamily: Fonts.semiBold, fontSize: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: BorderRadius.lg, padding: 14, fontFamily: Fonts.medium, fontSize: 16 },
  helperText: { fontFamily: Fonts.medium, fontSize: 12, marginBottom: Spacing.md },
  imageUpload: { width: '100%', aspectRatio: 3, borderRadius: BorderRadius.xl, borderWidth: 2, overflow: 'hidden' },
  uploadPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadText: { fontFamily: Fonts.semiBold, fontSize: 14 },
  previewImage: { width: '100%', height: '100%' },
  summaryCard: { borderRadius: BorderRadius.xxl, borderWidth: 1, padding: Spacing.xl, overflow: 'hidden', ...Shadows.lg },
  summaryTitle: { fontFamily: Fonts.extraBold, fontSize: 20, marginBottom: Spacing.lg, letterSpacing: -0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  summaryLabel: { fontFamily: Fonts.medium, fontSize: 15 },
  summaryValue: { fontFamily: Fonts.semiBold, fontSize: 15 },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: Spacing.md },
  totalLabel: { fontFamily: Fonts.extraBold, fontSize: 18 },
  totalValue: { fontFamily: Fonts.extraBold, fontSize: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, overflow: 'hidden' },
  buttonBlur: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
  createButton: { borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', height: 56, ...Shadows.md },
  createButtonText: { color: '#FFFFFF', fontFamily: Fonts.bold, fontSize: 16 },
});

