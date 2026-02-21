import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useToast } from '@/contexts/ToastContext';
import BackButton from '@/components/BackButton';
import GradientButton from '@/components/GradientButton';
import axios from 'axios';
import { supabase } from '@/src/utils/supabase';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

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
        showToast('success', 'Uploaded', `${asset.name} selected.`);
      }
    } catch (error) {
      showToast('error', 'Upload Failed', 'Could not pick document.');
    }
  };

  const uploadToSupabase = async (uri: string, fileName: string) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileExt = fileName.split('.').pop();
      const newFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `vendor_docs/${newFileName}`; // Inside the 'documents' bucket

      const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, blob, { contentType: blob.type });

      if (error) {
         console.error('Supabase upload error:', error);
         throw error;
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
      return;
    }

    setLoading(true);
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

      // API Call to register vendor/provider
      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      const endpoint = params.role === 'vendor' ? '/api/vendors' : '/api/service-providers';

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

      // Depending on if auth registration is combined, we call the endpoint directly for now
      // Note: Ideally, standard 'users' auth table creation happens here or in the backend controller.
      await axios.post(`${API_URL}${endpoint}`, payload);

      showAlert({
        title: 'Submitted Successfully!',
        message: 'Your documents will be reviewed within 24-48 hours. We\'ll notify you once approved.',
        type: 'success',
        buttons: [{ text: 'OK', onPress: () => router.replace('/login') }],
      });
    } catch (error) {
      console.error(error);
      showToast('error', 'Submission Failed', 'Could not submit documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDocCard = (
    key: keyof DocsState,
    title: string,
    required: boolean,
  ) => {
    const doc = docs[key];
    const hasFile = !!doc.uri;

    return (
      <View style={styles.docCard} key={key}>
        <View style={styles.docHeader}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={24}
            color={Colors.pink}
            style={styles.docIcon}
          />
          <View>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={[styles.docRequired, !required && styles.docOptional]}>
              {required ? 'Required' : 'Optional'}
            </Text>
          </View>
        </View>

        {hasFile && (
          <View style={styles.fileInfo}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <Text style={styles.fileName} numberOfLines={1}>
              {'  '}{doc.name}
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.uploadButton, hasFile && styles.uploadButtonDone]}
          onPress={() => pickDocument(key)}
        >
          <MaterialCommunityIcons
            name={hasFile ? 'check' : 'upload'}
            size={18}
            color={hasFile ? '#4CAF50' : Colors.pink}
          />
          <Text style={[styles.uploadText, hasFile && styles.uploadTextDone]}>
            {'  '}{hasFile ? 'Uploaded' : 'Upload'}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BackButton onPress={() => router.back()} />

        <Text style={styles.title}>Upload Documents</Text>
        <Text style={styles.subtitle}>
          Submit required business documents for verification
        </Text>

        {renderDocCard('businessLicense', 'Business License', true)}
        {renderDocCard('taxId', 'Tax ID / EIN', true)}
        {renderDocCard('insurance', 'Insurance Certificate', false)}

        <GradientButton
          title="Submit for Review"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: Spacing.md }}
        />

        <Text style={styles.reviewNote}>
          Documents will be reviewed within 24-48 hours
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    color: Colors.pink,
    fontSize: 30,
    fontFamily: Fonts.extraBoldItalic,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  docCard: {
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(30, 20, 50, 0.5)',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  docIcon: { marginRight: Spacing.md },
  docTitle: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontFamily: Fonts.bold,
  },
  docRequired: {
    color: Colors.pink,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  docOptional: { color: Colors.textMuted },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  fileName: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(233, 30, 140, 0.3)',
    backgroundColor: 'rgba(233, 30, 140, 0.05)',
  },
  uploadButtonDone: {
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  uploadText: {
    color: Colors.pink,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
  uploadTextDone: { color: '#4CAF50' },
  reviewNote: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
