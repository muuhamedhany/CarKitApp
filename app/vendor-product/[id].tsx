import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { apiFetch } from '@/services/api/client';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import type { Product } from '@/types/api.types';
import { BorderRadius, Fonts, FontSizes, Spacing } from '@/constants/theme';

type ProductResponse = {
  success: boolean;
  data: Product;
  message?: string;
};

type SimpleResponse = {
  success: boolean;
  message?: string;
};

const buildStockBadge = (stock: number) => {
  if (stock <= 0) {
    return { label: 'Out of stock', backgroundColor: 'rgba(239,68,68,0.16)', color: '#EF4444' };
  }

  if (stock <= 5) {
    return { label: 'Low stock', backgroundColor: 'rgba(249,115,22,0.16)', color: '#F97316' };
  }

  return { label: 'Healthy stock', backgroundColor: 'rgba(16,185,129,0.16)', color: '#10B981' };
};

export default function VendorProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch<ProductResponse>(`/products/${id}/manage`);
      setProduct(response.data);
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to load product details.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchProduct();
    }, [fetchProduct])
  );

  const publishInfo = useMemo(() => {
    const status = String(product?.status || 'active').toLowerCase();
    if (status === 'active') {
      return { label: 'Enabled', backgroundColor: 'rgba(16,185,129,0.16)', color: '#10B981' };
    }

    return { label: 'Disabled', backgroundColor: 'rgba(239,68,68,0.16)', color: '#EF4444' };
  }, [product?.status]);

  const stockInfo = useMemo(() => buildStockBadge(Number(product?.stock ?? 0)), [product?.stock]);

  const productImages = useMemo(
    () => [product?.image_url, product?.image_url_2, product?.image_url_3].filter((image): image is string => Boolean(image)),
    [product?.image_url, product?.image_url_2, product?.image_url_3]
  );

  const handleToggleStatus = async () => {
    if (!product || saving) {
      return;
    }

    const nextStatus = String(product.status || 'active').toLowerCase() === 'active' ? 'draft' : 'active';

    try {
      setSaving(true);
      const response = await apiFetch<ProductResponse>(`/products/${product.product_id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setProduct(response.data);
      showToast('success', 'Updated', response.message || `Product ${nextStatus === 'active' ? 'enabled' : 'disabled'} successfully.`);
    } catch (error: any) {
      showToast('error', 'Error', error.message || 'Failed to update product status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!product || saving) {
      return;
    }

    Alert.alert(
      'Delete product',
      'This will permanently remove the product from your inventory.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              const response = await apiFetch<SimpleResponse>(`/products/${product.product_id}`, { method: 'DELETE' });
              showToast('success', 'Deleted', response.message || 'Product deleted successfully.');
              router.replace('/(vendor-tabs)/products');
            } catch (error: any) {
              showToast('error', 'Error', error.message || 'Failed to delete product.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  if (!product) {
    return null;
  }

  const isEnabled = String(product.status || 'active').toLowerCase() === 'active';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerIconButton}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Product details</Text>
        <View style={styles.headerIconSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.imageWrap, { backgroundColor: colors.backgroundSecondary }]}> 
            {productImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageScrollContent}
              >
                {productImages.map((imageUri, index) => (
                  <Image
                    key={`${imageUri}-${index}`}
                    source={{ uri: imageUri }}
                    style={styles.galleryImage}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            ) : (
              <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
            )}
          </View>

          <View style={styles.heroInfo}>
            <Text style={[styles.productName, { color: colors.textPrimary }]}>{product.name}</Text>
            <Text style={[styles.productPrice, { color: colors.pink }]}>{Number(product.price).toLocaleString('en-EG')} EGP</Text>

            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: publishInfo.backgroundColor }]}>
                <Text style={[styles.badgeText, { color: publishInfo.color }]}>{publishInfo.label}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: stockInfo.backgroundColor }]}>
                <Text style={[styles.badgeText, { color: stockInfo.color }]}>{stockInfo.label}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Category</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{product.category_name || 'Uncategorized'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Stock</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{Number(product.stock ?? 0)} units</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Product ID</Text>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{product.product_id}</Text>
          </View>
        </View>

        <View style={[styles.descriptionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {product.description || 'No description available for this product.'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.push(`/edit-product/${product.product_id}`)}
            disabled={saving}
            style={({ pressed }) => [
              styles.editAction,
              { borderColor: colors.pink, opacity: pressed || saving ? 0.85 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="square-edit-outline" size={20} color={colors.pink} />
            <Text style={[styles.editActionText, { color: colors.pink }]}>Edit product</Text>
          </Pressable>

          <Pressable
            onPress={handleToggleStatus}
            disabled={saving}
            style={({ pressed }) => [
              styles.primaryAction,
              {
                backgroundColor: isEnabled ? colors.backgroundSecondary : colors.pink,
                borderColor: colors.pink,
                opacity: pressed || saving ? 0.85 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isEnabled ? 'pause-circle-outline' : 'play-circle-outline'}
              size={20}
              color={isEnabled ? colors.pink : colors.white}
            />
            <Text style={[styles.primaryActionText, { color: isEnabled ? colors.pink : colors.white }]}>
              {isEnabled ? 'Disable product' : 'Enable product'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={saving}
            style={({ pressed }) => [
              styles.deleteAction,
              { borderColor: '#EF4444', opacity: pressed || saving ? 0.85 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="delete-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteActionText}>Delete product</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconSpacer: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.lg,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  heroCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  imageWrap: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageScrollContent: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  galleryImage: {
    width: 240,
    height: 200,
    borderRadius: BorderRadius.md,
  },
  heroInfo: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  productName: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xl,
  },
  productPrice: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoLabel: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  infoValue: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.sm,
    textAlign: 'right',
    flexShrink: 1,
  },
  descriptionCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Fonts.regular,
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  primaryActionText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  editAction: {
    minHeight: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  editActionText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  deleteAction: {
    minHeight: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
  },
  deleteActionText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
    color: '#EF4444',
  },
});