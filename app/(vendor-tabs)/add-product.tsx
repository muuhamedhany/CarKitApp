import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { FormInput, GradientButton } from '@/components';
import { apiFetch } from '@/services/api/client';
import { supabase } from '@/lib/supabase';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

type ProductImage = {
  uri: string;
  base64: string | null;
};

type Category = {
  category_id: number;
  name: string;
};

export default function AddProductScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [loading, setLoading] = useState(false);
  
  const [images, setImages] = useState<ProductImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const resp = await apiFetch('/categories');
      if (resp.data) {
        setCategories(resp.data);
        if (resp.data.length > 0) {
          setSelectedCategoryId(resp.data[0].category_id);
        }
      }
    } catch (e) {
      console.error('Failed to categories', e);
    }
  };

  const pickImage = async () => {
    if (images.length >= 3) {
      showToast('info', 'Limit Reached', 'You can upload up to 3 images.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, { 
        uri: result.assets[0].uri, 
        base64: result.assets[0].base64 || null 
      }]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const uploadImage = async (base64File: string) => {
    const fileName = `product-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, decode(base64File), { contentType: 'image/jpeg' });
      
    if (error) {
      throw error;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
      
    return publicUrlData.publicUrl;
  };

  const handleAddProduct = async () => {
    if (!name.trim() || !price.trim()) {
      showToast('warning', 'Missing Fields', 'Name and Price are required.');
      return;
    }
    if (!selectedCategoryId) {
      showToast('warning', 'Category Required', 'Please select a category.');
      return;
    }

    try {
      setLoading(true);
      
      const uploadedUrls: string[] = [];
      for (const img of images) {
        if (img.base64) {
          const url = await uploadImage(img.base64);
          uploadedUrls.push(url);
        }
      }

      await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          stock: parseInt(stock, 10) || 0,
          category_id_fk: selectedCategoryId,
          image_url: uploadedUrls[0] || null,
          image_url_2: uploadedUrls[1] || null,
          image_url_3: uploadedUrls[2] || null,
        }),
      });

      showToast('success', 'Success', 'Product added successfully.');
      router.back();
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Add Product</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Images Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Product Images (Up to 3)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
          {images.map((img, index) => (
            <View key={index} style={[styles.imageContainer, { borderColor: colors.border }]}>
              <Image source={{ uri: img.uri }} style={styles.imagePreviewSmall} />
              <Pressable 
                style={[styles.removeImageBtn, { backgroundColor: colors.pink }]}
                onPress={() => removeImage(index)}
              >
                <MaterialCommunityIcons name="close" size={16} color="#fff" />
              </Pressable>
            </View>
          ))}
          
          {images.length < 3 && (
            <Pressable 
              style={[styles.imagePickerSmall, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={pickImage}
            >
              <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textMuted} />
              <Text style={[styles.imagePlaceholderTextSmall, { color: colors.textMuted }]}>Add Photo</Text>
            </Pressable>
          )}
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

        {/* Categories Selection */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: Spacing.md }]}>Category</Text>
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
                    borderColor: isSelected ? colors.pink : colors.border
                  }
                ]}
              >
                <Text style={[styles.categoryText, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        
        <View style={styles.submitContainer}>
          <GradientButton 
            title="Create Product" 
            onPress={handleAddProduct} 
            loading={loading}
          />
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
    padding: Spacing.xl,
    paddingBottom: 150,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfWidth: {
    flex: 1,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePreviewSmall: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerSmall: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderTextSmall: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.xs,
    marginTop: 4,
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
