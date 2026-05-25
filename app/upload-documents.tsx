import {
  useTheme } from '@/hooks/useTheme';
import { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useToast } from '@/contexts/ToastContext';
import { CenteredHeader, GradientButton, GlassView} from '@/components';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { Spacing, FontSizes, BorderRadius, Fonts, Shadows } from '@/constants/theme';
import Text from '@/components/common/LocalizedText';
import { useTranslation } from '@/contexts/LanguageContext';
import { rowDirection, textAlign } from '@/utils/rtl';

const { height } = Dimensions.get('window');

type DocStatus = {
  name: string | null;
  uri: string | null;
};

type DocsState = {
  businessLicense: DocStatus;
  taxId: DocStatus;
  nationalIdFront: DocStatus;
  nationalIdBack: DocStatus;
  selfie: DocStatus;
  experienceCerts: DocStatus;
};

export default function UploadDocumentsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showToast, showAlert } = useToast();
  const { t, isRTL } = useTranslation();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [infoModal, setInfoModal] = useState<{ visible: boolean; titleKey: string; bodyKey: string }>({
    visible: false,
    titleKey: '',
    bodyKey: '',
  });

  const [docs, setDocs] = useState<DocsState>({
    businessLicense: { name: null, uri: null },
    taxId: { name: null, uri: null },
    nationalIdFront: { name: null, uri: null },
    nationalIdBack: { name: null, uri: null },
    selfie: { name: null, uri: null },
    experienceCerts: { name: null, uri: null },
  });

  const openInfo = (titleKey: string, bodyKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInfoModal({ visible: true, titleKey, bodyKey });
  };

  const closeInfo = () => setInfoModal({ visible: false, titleKey: '', bodyKey: '' });

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
        showToast('success', t('docs.selectedTitle'), `${asset.name} ${t('docs.selectedReady')}`);
      }
    } catch {
      showToast('error', t('docs.selectionFailed'), t('docs.selectionFailedMsg'));
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
    // Required: businessLicense, taxId, nationalIdFront, nationalIdBack, selfie
    if (
      !docs.businessLicense.uri ||
      !docs.taxId.uri ||
      !docs.nationalIdFront.uri ||
      !docs.nationalIdBack.uri ||
      !docs.selfie.uri
    ) {
      showToast('warning', t('docs.missingTitle'), t('docs.missingMsg'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      showToast('info', t('docs.uploadingTitle'), t('docs.uploadingMsg'));

      const doc1Url = await uploadToSupabase(docs.businessLicense.uri, docs.businessLicense.name || 'doc1.pdf');
      if (!doc1Url) throw new Error('Failed to upload Business License');

      const doc2Url = await uploadToSupabase(docs.taxId.uri, docs.taxId.name || 'doc2.pdf');
      if (!doc2Url) throw new Error('Failed to upload Tax ID');

      const doc3Url = await uploadToSupabase(docs.nationalIdFront.uri, docs.nationalIdFront.name || 'doc3.pdf');
      if (!doc3Url) throw new Error('Failed to upload National ID Front');

      const doc4Url = await uploadToSupabase(docs.nationalIdBack.uri, docs.nationalIdBack.name || 'doc4.pdf');
      if (!doc4Url) throw new Error('Failed to upload National ID Back');

      const doc5Url = await uploadToSupabase(docs.selfie.uri, docs.selfie.name || 'doc5.jpg');
      if (!doc5Url) throw new Error('Failed to upload Selfie');

      // Optional: experience certs
      let doc6Url = null;
      if (docs.experienceCerts.uri) {
        doc6Url = await uploadToSupabase(docs.experienceCerts.uri, docs.experienceCerts.name || 'doc6.pdf');
      }

      showToast('info', t('docs.registeringTitle'), t('docs.registeringMsg'));

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
        document_4_url: doc4Url,
        document_5_url: doc5Url,
        document_6_url: doc6Url,
        latitude: params.latitude ? Number(params.latitude) : null,
        longitude: params.longitude ? Number(params.longitude) : null,
      };

      await axios.post(`${API_URL}${endpoint}`, payload);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert({
        title: t('docs.successTitle'),
        message: t('docs.successMsg'),
        type: 'success',
        buttons: [{ text: t('docs.backToLogin'), onPress: () => router.replace('/login') }],
      });
    } catch (error) {
      console.error(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', t('docs.submitFailed'), t('docs.submitFailedMsg'));
    } finally {
      setLoading(false);
    }
  };

  const renderDocCard = (
    key: keyof DocsState,
    titleKey: string,
    required: boolean,
    delay: number,
    infoTitleKey: string,
    infoBodyKey: string,
    iconName: string
  ) => {
    const doc = docs[key];
    const hasFile = !!doc.uri;

    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(600)} style={styles.docCardContainer} key={key}>
        <GlassView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.docCard,
            { borderColor: hasFile ? '#4CAF50' : colors.cardBorder },
            Shadows.md
          ]}
        >
          <View style={[styles.docHeader, { flexDirection: rowDirection(isRTL) }]}>
            <View style={[styles.iconBox, { backgroundColor: hasFile ? 'rgba(76, 175, 80, 0.1)' : colors.pink + '15' }]}>
              <MaterialCommunityIcons
                name={hasFile ? 'check-decagram' : iconName as any}
                size={24}
                color={hasFile ? '#4CAF50' : colors.pink}
              />
            </View>
            <View style={styles.docInfo}>
              <Text style={[styles.docTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>
                {t(titleKey)}
              </Text>
              <Text style={[styles.docRequired, { color: required ? colors.pink : colors.textMuted }]}>
                {required ? t('docs.mandatory') : t('docs.optional')}
              </Text>
            </View>
            {/* Info button */}
            <Pressable
              onPress={() => openInfo(infoTitleKey, infoBodyKey)}
              style={({ pressed }) => [styles.infoBtn, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
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
              {hasFile ? t('docs.changeFile') : t('docs.chooseDoc')}
            </Text>
          </Pressable>
        </GlassView>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.bgGradientStart, colors.bgGradientEnd]}
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
          <CenteredHeader title={t('docs.screenTitle')} titleColor={colors.pink} />
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('docs.screenSubtitle')}
          </Text>
        </Animated.View>

        <View style={styles.cardsWrapper}>
          {/* Section: Business Documents */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {t('docs.sectionBusiness')}
            </Text>
          </Animated.View>

          {renderDocCard(
            'businessLicense',
            'docs.businessLicense',
            true, 350,
            'docs.businessLicense',
            'docs.businessLicenseInfo',
            'certificate'
          )}
          {renderDocCard(
            'taxId',
            'docs.taxId',
            true, 420,
            'docs.taxId',
            'docs.taxIdInfo',
            'identifier'
          )}

          {/* Section: Owner Identity */}
          <Animated.View entering={FadeInDown.delay(490).duration(600)}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {t('docs.sectionOwner')}
            </Text>
          </Animated.View>

          {renderDocCard(
            'nationalIdFront',
            'docs.nationalIdFront',
            true, 520,
            'docs.nationalIdFront',
            'docs.nationalIdFrontInfo',
            'card-account-details-outline'
          )}
          {renderDocCard(
            'nationalIdBack',
            'docs.nationalIdBack',
            true, 580,
            'docs.nationalIdBack',
            'docs.nationalIdBackInfo',
            'card-account-details-star-outline'
          )}
          {renderDocCard(
            'selfie',
            'docs.selfie',
            true, 640,
            'docs.selfie',
            'docs.selfieInfo',
            'camera-account'
          )}

          {/* Section: Certifications */}
          <Animated.View entering={FadeInDown.delay(700).duration(600)}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              {t('docs.sectionCerts')}
            </Text>
          </Animated.View>

          {renderDocCard(
            'experienceCerts',
            'docs.experienceCerts',
            false, 740,
            'docs.experienceCerts',
            'docs.experienceCertsInfo',
            'school-outline'
          )}
        </View>

        <Animated.View entering={FadeInDown.delay(820).duration(800)}>
          <GradientButton
            title={t('docs.completeRegistration')}
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitBtn}
          />
          <Text style={[styles.reviewNote, { color: colors.textMuted }]}>
            {t('docs.reviewNote')}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Info Modal */}
      <Modal
        visible={infoModal.visible}
        transparent
        animationType="fade"
        onRequestClose={closeInfo}
      >
        <TouchableWithoutFeedback onPress={closeInfo}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: isDark ? colors.card : '#fff', borderColor: colors.cardBorder }]}>
                <View style={[styles.modalIconRow, { flexDirection: rowDirection(isRTL) }]}>
                  <View style={[styles.modalIconBox, { backgroundColor: colors.pink + '18' }]}>
                    <MaterialCommunityIcons name="information" size={22} color={colors.pink} />
                  </View>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary, textAlign: textAlign(isRTL) }]}>
                    {infoModal.titleKey ? t(infoModal.titleKey) : ''}
                  </Text>
                  <Pressable onPress={closeInfo} hitSlop={8} style={{ marginLeft: 'auto' }}>
                    <MaterialCommunityIcons name="close" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
                <Text style={[styles.modalBody, { color: colors.textSecondary, textAlign: textAlign(isRTL) }]}>
                  {infoModal.bodyKey ? t(infoModal.bodyKey) : ''}
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontFamily: Fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    marginLeft: 4,
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
    gap: Spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  infoBtn: {
    padding: 4,
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
  // Info Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
    flex: 1,
  },
  modalBody: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    lineHeight: 22,
    opacity: 0.85,
  },
});
