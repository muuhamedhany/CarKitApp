import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ProductForm } from '@/components';
import { FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { Product, ProductFormInitialValues, ProductFormPayload } from '@/types/api.types';

export default function EditProductScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { colors } = useTheme();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [initialValues, setInitialValues] = useState<ProductFormInitialValues | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchProduct = async () => {
            if (!id) {
                showToast('error', 'Error', 'Missing product id.');
                router.back();
                return;
            }

            try {
                const response = await apiFetch(`/products/${id}`);
                const product = response.data as Product;

                if (isMounted) {
                    setInitialValues({
                        name: product.name,
                        description: product.description ?? '',
                        price: product.price,
                        stock: product.stock ?? 0,
                        categoryId: product.category_id_fk ?? null,
                        imageUrls: [product.image_url ?? null, product.image_url_2 ?? null, product.image_url_3 ?? null],
                    });
                }
            } catch (error: any) {
                showToast('error', 'Error', error?.message || 'Failed to load product.');
                router.back();
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProduct();

        return () => {
            isMounted = false;
        };
    }, [id, router, showToast]);

    const handleUpdateProduct = async (payload: ProductFormPayload) => {
        await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        showToast('success', 'Success', 'Product updated successfully.');
        router.back();
    };

    if (loading || !initialValues) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.pink} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading product...</Text>
            </View>
        );
    }

    return (
        <ProductForm
            screenTitle="Edit Product"
            submitLabel="Save Changes"
            initialValues={initialValues}
            onSubmit={handleUpdateProduct}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    loadingText: {
        marginTop: Spacing.md,
        fontFamily: Fonts.medium,
        fontSize: FontSizes.sm,
    },
});
