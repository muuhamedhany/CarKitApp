import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { decode } from 'base64-arraybuffer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Category, ProductFormInitialValues, ProductFormPayload } from '@/types/api.types';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { supabase } from '@/lib/supabase';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';
import FormInput from './FormInput';
import GradientButton from './GradientButton';

type ImageSlot = {
  previewUri: string | null;
  base64: string | null;
  sourceUrl: string | null;
};

type ProductFormProps = {
  screenTitle: string;
  submitLabel: string;
  initialValues?: ProductFormInitialValues;
  onSubmit: (payload: ProductFormPayload) => Promise<void>;
};

const createImageSlots = (imageUrls?: (string | null)[]): ImageSlot[] =>
  Array.from({ length: 3 }, (_, index) => {
    const imageUrl = imageUrls?.[index] ?? null;
    return {
      previewUri: imageUrl,
      base64: null,
      sourceUrl: imageUrl,
    };
  });

export default function ProductForm({ screenTitle, submitLabel, initialValues, onSubmit }: ProductFormProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(createImageSlots());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(initialValues?.name ?? '');
    setDescription(initialValues?.description ?? '');
    setPrice(initialValues?.price !== undefined && initialValues?.price !== null ? String(initialValues.price) : '');
    setStock(initialValues?.stock !== undefined && initialValues?.stock !== null ? String(initialValues.stock) : '0');
    setSelectedCategoryId(initialValues?.categoryId ?? null);
    setImageSlots(createImageSlots(initialValues?.imageUrls));
  }, [initialValues]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const response = await apiFetch('/categories');
        if (isMounted && response.data) {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Failed to load categories', error);
        showToast('error', 'Error', 'Failed to load categories.');
      } finally {
        if (isMounted) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    if (!selectedCategoryId && categories.length > 0) {
      setSelectedCategoryId(categories[0].category_id);
    }
  }, [categories, selectedCategoryId]);

  const uploadImage = async (base64File: string, slotIndex: number) => {
    const fileName = `product-${Date.now()}-${slotIndex}-${Math.floor(Math.random() * 1000)}.jpg`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, decode(base64File), { contentType: 'image/jpeg' });

    if (error) {
      throw error;
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const pickImage = async (slotIndex: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];
      setImageSlots((current) => {
        const next = [...current];
        next[slotIndex] = {
          previewUri: asset.uri,
          base64: asset.base64 ?? null,
          sourceUrl: current[slotIndex]?.sourceUrl ?? null,
        };
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !price.trim()) {
      showToast('warning', 'Missing Fields', 'Name and Price are required.');
      return;
    }

    if (!selectedCategoryId) {
      showToast('warning', 'Category Required', 'Please select a category.');
      return;
    }

    setSubmitting(true);

    try {
      const uploadedUrls = await Promise.all(
        imageSlots.map(async (slot, slotIndex) => {
          if (slot.base64) {
            return uploadImage(slot.base64, slotIndex);
          }

          return slot.sourceUrl;
        })
      );

      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock, 10) || 0,
        category_id_fk: selectedCategoryId,
        image_url: uploadedUrls[0] || null,
        image_url_2: uploadedUrls[1] || null,
        image_url_3: uploadedUrls[2] || null,
      });
    } catch (error: any) {
      showToast('error', 'Error', error?.message || 'Failed to save product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingTop: Spacing.lg }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{screenTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Images (1, 2, 3)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
          {imageSlots.map((slot, index) => {
            const hasImage = !!slot.previewUri;

            return (
              <Pressable
                key={index}
                onPress={() => pickImage(index)}
                style={[
                  styles.imageSlot,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={[styles.imagePreview, { backgroundColor: colors.backgroundSecondary }]}>
                  {hasImage ? (
                    <Image source={{ uri: slot.previewUri! }} style={styles.image} />
                  ) : (
                    <MaterialCommunityIcons name="camera-plus" size={28} color={colors.textMuted} />
                  )}
                </View>
                <Text style={[styles.imageLabel, { color: colors.textSecondary }]}>
                  {hasImage ? `Replace ${index + 1}` : `Add ${index + 1}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <FormInput
          icon="format-title"
          placeholder="Product Name * (e.g. Engine Oil 5W-30)"
          value={name}
          onChangeText={setName}
        />

        <FormInput
          icon="text"
          placeholder="Product details..."
          value={description}
          onChangeText={setDescription}
        />

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <FormInput
              icon="currency-usd"
              placeholder="Price ($) *"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
          <View style={styles.halfWidth}>
            <FormInput
              icon="package-variant"
              placeholder="Stock"
              keyboardType="number-pad"
              value={stock}
              onChangeText={setStock}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Category</Text>
        {categoriesLoading ? (
          <ActivityIndicator size="small" color={colors.pink} style={styles.categoryLoader} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.category_id;

              return (
                <Pressable
                  key={cat.category_id}
                  onPress={() => setSelectedCategoryId(cat.category_id)}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: isSelected ? colors.pink : colors.card,
                      borderColor: isSelected ? colors.pink : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.categoryText, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.submitContainer}>
          <GradientButton title={submitLabel} onPress={handleSubmit} loading={submitting} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 150,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  imageSlot: {
    width: 112,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.xs,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageLabel: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  categoryLoader: {
    marginVertical: Spacing.sm,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
  },
  submitContainer: {
    marginTop: Spacing.lg,
  },
});