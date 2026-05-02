import { apiFetch } from './client';
import { ApiResponse, VendorAnalyticsRange, VendorAnalyticsResponse, VendorDashboardResponse, VendorOrder } from '@/types/api.types';

export const vendorService = {
    async getDashboard() {
        return apiFetch<ApiResponse<VendorDashboardResponse>>('/vendors/me/dashboard');
    },

    async getAnalytics(range: VendorAnalyticsRange = 'monthly') {
        const query = range ? `?range=${encodeURIComponent(range)}` : '';
        return apiFetch<ApiResponse<VendorAnalyticsResponse>>(`/vendors/me/analytics${query}`);
    },

    async getOrders(status: string = 'all', page: number = 1, pageSize: number = 10, search?: string) {
        const query = new URLSearchParams();
        if (status && status !== 'all') query.append('status', status);
        if (search) query.append('search', search);
        query.append('page', page.toString());
        query.append('pageSize', pageSize.toString());
        return apiFetch<ApiResponse<VendorOrder[]>>(`/vendors/me/orders?${query.toString()}`);
    },

    async updateOrderStatus(orderId: number, status: string) {
        return apiFetch<ApiResponse<{ order_id: number; status: string }>>(`/vendors/me/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    },
};