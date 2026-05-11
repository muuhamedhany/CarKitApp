import { ApiResponse, Product, VendorAnalyticsRange, VendorAnalyticsResponse, VendorDashboardResponse, VendorOrder, VendorPublicProfile } from '@/types/api.types';
import { apiFetch } from './client';
import { API_URL } from '@/constants/config';

export const vendorService = {
    async getDashboard() {
        return apiFetch<ApiResponse<VendorDashboardResponse>>('/vendors/me/dashboard');
    },

    async getAnalytics(range: VendorAnalyticsRange = 'monthly') {
        const query = range ? `?range=${encodeURIComponent(range)}` : '';
        return apiFetch<ApiResponse<VendorAnalyticsResponse>>(`/vendors/me/analytics${query}`);
    },

    async getOrders(status: string = 'all', page: number = 1, pageSize: number = 10, search?: string) {
        let url = `/vendors/me/orders?page=${page}&pageSize=${pageSize}`;
        if (status && status !== 'all') url += `&status=${encodeURIComponent(status)}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        console.log(`[VendorService] API_URL: ${API_URL}, endpoint: ${url}`);
        return apiFetch<ApiResponse<VendorOrder[]>>(url);
    },

    async updateOrderStatus(orderId: number, status: string) {
        return apiFetch<ApiResponse<{ order_id: number; status: string }>>(`/vendors/me/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },

    async getVendorById(vendorId: number) {
        try {
            // Fetch profile and products in parallel
            const [profileRes, productsRes1, productsRes2] = await Promise.all([
                apiFetch<ApiResponse<VendorPublicProfile>>(`/vendors/${vendorId}`).catch(() => null),
                apiFetch<ApiResponse<Product[]>>(`/products?vendor_id=${vendorId}`).catch(() => null),
                apiFetch<ApiResponse<Product[]>>(`/products?vendor_id_fk=${vendorId}`).catch(() => null)
            ]);

            const profile = profileRes?.success ? profileRes.data : null;

            // Combine products and strictly verify they belong to this vendor (checking all possible ID fields)
            const isMatch = (p: any, id: any) => {
                const sId = String(id);
                return String(p.vendor_id) === sId ||
                    String(p.vendor_id_fk) === sId ||
                    String(p.user_id) === sId ||
                    String(p.user_id_fk) === sId;
            };

            let allProducts: Product[] = [];
            if (productsRes1?.success && productsRes1.data) {
                const filtered = productsRes1.data.filter(p => isMatch(p, vendorId));
                allProducts = [...allProducts, ...filtered];
            }
            if (productsRes2?.success && productsRes2.data) {
                const existingIds = new Set(allProducts.map(p => p.product_id));
                const filtered = productsRes2.data.filter(p => isMatch(p, vendorId) && !existingIds.has(p.product_id));
                allProducts = [...allProducts, ...filtered];
            }

            // Merge products into the profile and filter strictly
            if (profile) {
                const profileProducts = Array.isArray(profile.products) ? profile.products : [];
                const mergedProducts = [...allProducts, ...profileProducts];

                // Deduplicate and filter by ID (string or number)
                const finalProducts = mergedProducts.filter((p, index, self) =>
                    isMatch(p, vendorId) &&
                    self.findIndex(t => t.product_id === p.product_id) === index
                );

                return {
                    success: true,
                    data: {
                        ...profile,
                        products: finalProducts
                    }
                } as ApiResponse<VendorPublicProfile>;
            }

            // If profile fetch failed but we have products
            if (allProducts.length > 0) {
                return {
                    success: true,
                    data: {
                        vendor_id: vendorId,
                        name: allProducts[0].vendor_name || 'Vendor',
                        products: allProducts,
                        rating: allProducts[0].rating || 0,
                        review_count: allProducts[0].review_count || 0
                    }
                } as ApiResponse<VendorPublicProfile>;
            }

            throw new Error('Vendor not found');
        } catch (error) {
            console.error('[VendorService] Error in getVendorById:', error);
            throw error;
        }
    },
};