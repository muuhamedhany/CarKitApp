import { apiFetch } from './client';
import { ApiResponse, VendorDashboardResponse, VendorOrder } from '@/types/api.types';

export const vendorService = {
    async getDashboard() {
        return apiFetch<ApiResponse<VendorDashboardResponse>>('/vendors/me/dashboard');
    },

    async getOrders(status: string = 'all') {
        const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
        return apiFetch<ApiResponse<VendorOrder[]>>(`/vendors/me/orders${query}`);
    },

    async updateOrderStatus(orderId: number, status: string) {
        return apiFetch<ApiResponse<{ order_id: number; status: string }>>(`/vendors/me/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },
};