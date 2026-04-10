import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { Product } from '@/types/api.types';
import { Spacing, FontSizes, Fonts, BorderRadius } from '@/constants/theme';

export default function VendorProductsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/products?vendor_id=${user?.vendor_id}`);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (e: any) {
      showToast('error', 'Error', e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.vendor_id]);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [fetchProducts])
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable
      onPress={() => router.push(`/edit-product/${item.product_id}`)}
      style={({ pressed }) => [styles.productPressable, { opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Image
          source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}> 
          <View style={styles.productHeaderRow}>
            <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.editBadge, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="pencil" size={12} color={colors.pink} />
              <Text style={[styles.editBadgeText, { color: colors.pink }]}>Edit</Text>
            </View>
          </View>
          <Text style={[styles.productPrice, { color: colors.pink }]}>${Number(item.price).toFixed(2)}</Text>
          <Text style={[styles.productStock, { color: colors.textMuted }]}>Stock: {item.stock}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Products</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.pink} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.product_id?.toString() || Math.random().toString()}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="package-variant" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products found.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <Pressable 
        style={[styles.fab, { backgroundColor: '#c80ceb', bottom: insets.bottom + 80 }]}
        onPress={() => router.push('/(vendor-tabs)/add-product')}
      >
        <MaterialCommunityIcons name="plus" size={28} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.xxl,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 150,
    gap: Spacing.md,
  },
  productPressable: {
    borderRadius: BorderRadius.lg,
  },
  productCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: '#333',
  },
  productInfo: {
    marginLeft: Spacing.md,
    justifyContent: 'center',
    flex: 1,
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  productName: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.md,
  },
  productPrice: {
    fontFamily: Fonts.bold,
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  productStock: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.sm,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  editBadgeText: {
    fontFamily: Fonts.semiBold,
    fontSize: FontSizes.xs,
  },
  emptyState: {
    padding: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontFamily: Fonts.medium,
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
  },
  fab: {
    position: 'absolute',
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
