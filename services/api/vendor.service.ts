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
};