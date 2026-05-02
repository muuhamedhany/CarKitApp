import { apiFetch } from './client';
import { ApiResponse, VendorAnalyticsRange, VendorAnalyticsResponse, VendorDashboardResponse, VendorOrder } from '@/types/api.types';
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
};