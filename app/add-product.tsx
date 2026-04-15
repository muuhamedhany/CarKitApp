import { useRouter } from 'expo-router';

import { ProductForm } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { ProductFormPayload } from '@/types/api.types';

export default function AddProductScreen() {
    const router = useRouter();
    const { showToast } = useToast();

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
            screenTitle="Add Product"
            submitLabel="Create Product"
            onSubmit={handleAddProduct}
        />
    );
}
