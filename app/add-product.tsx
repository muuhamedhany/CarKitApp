import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ProductForm } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { ProductFormInitialValues, ProductFormPayload } from '@/types/api.types';

export default function AddProductScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const params = useLocalSearchParams<{
        duplicate_name?: string;
        duplicate_description?: string;
        duplicate_price?: string;
        duplicate_stock?: string;
        duplicate_category_id?: string;
    }>();

    const initialValues = useMemo<ProductFormInitialValues | undefined>(() => {
        if (!params.duplicate_name) return undefined;
        return {
            name: params.duplicate_name,
            description: params.duplicate_description || '',
            price: params.duplicate_price || '',
            stock: params.duplicate_stock || '0',
            categoryId: params.duplicate_category_id ? Number(params.duplicate_category_id) : null,
        };
    }, [params.duplicate_name, params.duplicate_description, params.duplicate_price, params.duplicate_stock, params.duplicate_category_id]);

    const handleAddProduct = async (payload: ProductFormPayload) => {
        const response = await apiFetch<{ success: boolean; data: any; message?: string }>('/products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        showToast(
            'success',
            'Product Created',
            response.message || 'Your product has been submitted for admin approval.'
        );
        router.back();
    };

    return (
        <ProductForm
            screenTitle={initialValues ? 'Duplicate Product' : 'Add Product'}
            submitLabel="Create Product"
            initialValues={initialValues}
            onSubmit={handleAddProduct}
        />
    );
}
