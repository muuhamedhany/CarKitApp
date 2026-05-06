import { useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader, GradientButton } from '@/components';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows } from '@/constants/theme';

const { height } = Dimensions.get('window');

type DocStatus = {
  name: string | null;
  uri: string | null;
};

type DocsState = {
  businessLicense: DocStatus;
  taxId: DocStatus;
  insurance: DocStatus;
};

export default function UploadDocumentsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast, showAlert } = useToast();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocsState>({
    businessLicense: { name: null, uri: null },
    taxId: { name: null, uri: null },
    insurance: { name: null, uri: null },
  });

  const pickDocument = async (key: keyof DocsState) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setDocs((prev) => ({
          ...prev,
          [key]: { name: asset.name, uri: asset.uri },
        }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('success', 'Selected', `${asset.name} ready.`);
      }
    } catch {
      showToast('error', 'Selection Failed', 'Could not pick document.');
    }
  };

  const uploadToSupabase = async (uri: string, fileName: string) => {
    try {
      const fileExt = fileName.split('.').pop() || 'tmp';
      const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `vendor_docs/${newFileName}`;
      const contentType = fileExt.toLowerCase() === 'pdf' ? 'application/pdf' : 'image/jpeg';

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase Config Missing');
      }

      const uploadUrl = `${supabaseUrl}/storage/v1/object/documents/${filePath}`;

      const response = await FileSystem.uploadAsync(uploadUrl, uri, {
        httpMethod: 'POST',
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          'Content-Type': contentType,
        },
      });

      if (response.status < 200 || response.status >= 300) {
        console.error('Supabase raw upload error:', response.body);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (e) {
      console.error('Upload Error', e);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!docs.businessLicense.uri || !docs.taxId.uri) {
      showToast('warning', 'Missing Documents', 'Please upload all required documents.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      showToast('info', 'Uploading', 'Uploading documents securely...');

      // Upload 1
      const doc1Url = await uploadToSupabase(docs.businessLicense.uri, docs.businessLicense.name || 'doc1.pdf');
      if (!doc1Url) throw new Error('Failed to upload Business License');

      // Upload 2
      const doc2Url = await uploadToSupabase(docs.taxId.uri, docs.taxId.name || 'doc2.pdf');
      if (!doc2Url) throw new Error('Failed to upload Tax ID');

      // Upload 3 (optional)
      let doc3Url = null;
      if (docs.insurance.uri) {
        doc3Url = await uploadToSupabase(docs.insurance.uri, docs.insurance.name || 'doc3.pdf');
      }

      showToast('info', 'Registering', 'Creating your account...');

      const API_URL = process.env.EXPO_PUBLIC_API_URL;
      const endpoint = params.role === 'vendor' ? '/vendors' : '/service-providers';

      const payload = {
        name: params.name,
        email: params.email,
        phone: params.phone,
        contact_info: params.address,
        password: params.password,
        document_1_url: doc1Url,
        document_2_url: doc2Url,
        document_3_url: doc3Url,
      };

      await axios.post(`${API_URL}${endpoint}`, payload);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        title: 'Success!',
        message: 'Your documents are under review. We\'ll notify you within 24-48 hours.',
        type: 'success',
        buttons: [{ text: 'Back to Login', onPress: () => router.replace('/login') }],
      });
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Submission Failed', 'Could not submit documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDocCard = (
    key: keyof DocsState,
    title: string,
    required: boolean,
    delay: number
  ) => {
    const doc = docs[key];
    const hasFile = !!doc.uri;

    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.docCardContainer} key={key}>
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.docCard,
            { borderColor: hasFile ? '#4CAF50' : colors.cardBorder },
            Shadows.md
          ]}
        >
          <View style={styles.docHeader}>
            <View style={[styles.iconBox, { backgroundColor: hasFile ? 'rgba(76, 175, 80, 0.1)' : colors.pink + '15' }]}>
              <MaterialCommunityIcons
                name={hasFile ? 'check-decagram' : 'file-document-outline'}
                size={24}
                color={hasFile ? '#4CAF50' : colors.pink}
              />
            </View>
            <View style={styles.docInfo}>
              <Text style={[styles.docTitle, { color: colors.textPrimary }]}>{title}</Text>
              <Text style={[styles.docRequired, { color: required ? colors.pink : colors.textMuted }]}>
                {required ? 'Mandatory' : 'Optional'}
              </Text>
            </View>
          </View>

          {hasFile && (
            <View style={styles.fileLabel}>
              <Text style={[styles.fileName, { color: colors.textSecondary }]} numberOfLines={1}>
                {doc.name}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.uploadButton,
              { 
                backgroundColor: hasFile ? 'rgba(76, 175, 80, 0.05)' : colors.pink + '10',
                borderColor: hasFile ? 'rgba(76, 175, 80, 0.3)' : colors.pink + '30',
                opacity: pressed ? 0.7 : 1
              }
            ]}
            onPress={() => pickDocument(key)}
          >
            <MaterialCommunityIcons
              name={hasFile ? 'refresh' : 'upload-outline'}
              size={18}
              color={hasFile ? '#4CAF50' : colors.pink}
            />
            <Text style={[styles.uploadText, { color: hasFile ? '#4CAF50' : colors.pink }]}>
              {hasFile ? 'Change File' : 'Choose Document'}
            </Text>
          </Pressable>
        </BlurView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1A0B2E', '#000000'] : ['#F8F0FF', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Decorative Orbs */}
      <View style={[styles.orb, { top: -100, left: -50, backgroundColor: colors.pink + '20' }]} />
      <View style={[styles.orb, { bottom: -100, right: -50, backgroundColor: colors.purple + '15' }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(200).duration(800)}>
          <CenteredHeader title="Verify Identity" titleColor={colors.pink} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Securely upload your business documents to start your journey
          </Text>
        </Animated.View>

        <View style={styles.cardsWrapper}>
          {renderDocCard('businessLicense', 'Business License', true, 400)}
          {renderDocCard('taxId', 'Tax ID / EIN', true, 500)}
          {renderDocCard('insurance', 'Insurance (Liability)', false, 600)}
        </View>

        <Animated.View entering={FadeInDown.delay(700).duration(800)}>
          <GradientButton
            title="Complete Registration"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
          <Text style={[styles.reviewNote, { color: colors.textMuted }]}>
            Verification usually takes 24 hours
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: height * 0.05,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.medium,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    marginTop: 4,
    opacity: 0.7,
  },
  cardsWrapper: {
    marginBottom: Spacing.xl,
  },
  docCardContainer: {
    marginBottom: Spacing.lg,
  },
  docCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
  docRequired: {
    fontSize: 10,
    fontFamily: Fonts.medium,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  fileLabel: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  fileName: {
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  uploadText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
  },
  submitBtn: {
    marginTop: Spacing.md,
  },
  reviewNote: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: Spacing.lg,
    opacity: 0.6,
  },
});
