import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ProductForm } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { ProductFormInitialValues, ProductFormPayload } from '@/types/api.types';

const parseDuplicateArray = (value?: string) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
    } catch {
        return [];
    }
};

export default function AddProductScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const params = useLocalSearchParams<{
        duplicate_name?: string;
        duplicate_description?: string;
        duplicate_price?: string;
        duplicate_stock?: string;
        duplicate_category_id?: string;
        duplicate_compatible_makes?: string;
        duplicate_compatible_models?: string;
    }>();

    const initialValues = useMemo<ProductFormInitialValues | undefined>(() => {
        if (!params.duplicate_name) return undefined;
        const compatibleMakes = parseDuplicateArray(params.duplicate_compatible_makes);
        const compatibleModels = parseDuplicateArray(params.duplicate_compatible_models);
        return {
            name: params.duplicate_name,
            description: params.duplicate_description || '',
            price: params.duplicate_price || '',
            stock: params.duplicate_stock || '0',
            categoryId: params.duplicate_category_id ? Number(params.duplicate_category_id) : null,
            compatibleMakes,
            compatibleModels,
            isUniversal: compatibleMakes.length === 0 && compatibleModels.length === 0,
        };
    }, [
        params.duplicate_name,
        params.duplicate_description,
        params.duplicate_price,
        params.duplicate_stock,
        params.duplicate_category_id,
        params.duplicate_compatible_makes,
        params.duplicate_compatible_models,
    ]);

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
