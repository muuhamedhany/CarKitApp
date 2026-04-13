import { useRouter } from 'expo-router';

import { ProductForm } from '@/components';
import { useToast } from '@/contexts/ToastContext';
import { apiFetch } from '@/services/api/client';
import { ProductFormPayload } from '@/types/api.types';

export default function AddProductScreen() {
    const router = useRouter();
    const { showToast } = useToast();

    const handleAddProduct = async (payload: ProductFormPayload) => {
        await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        showToast('success', 'Success', 'Product added successfully.');
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
