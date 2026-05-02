import { apiFetch } from './client';
import {
    ApiResponse,
    ProviderAnalyticsRange,
    ProviderAnalyticsResponse,
    ProviderBooking,
    ProviderBookingDetail,
    ProviderDashboardResponse,
    Service,
    ServiceFormPayload,
} from '@/types/api.types';

export const providerService = {
    // Dashboard
    async getDashboard() {
        return apiFetch<ApiResponse<ProviderDashboardResponse>>('/service-providers/me/dashboard');
    },

    // Analytics
    async getAnalytics(range: ProviderAnalyticsRange = 'monthly') {
        const query = range ? `?range=${encodeURIComponent(range)}` : '';
        return apiFetch<ApiResponse<ProviderAnalyticsResponse>>(`/service-providers/me/analytics${query}`);
    },

    // Bookings list (with optional status/date filter)
    async getBookings(status: string = 'all', date?: string, page: number = 1, limit: number = 10, search?: string) {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        if (date) params.append('date', date);
        if (page) params.append('page', page.toString());
        if (limit) params.append('limit', limit.toString());
        if (search) params.append('search', search);
        
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiFetch<ApiResponse<ProviderBooking[]>>(`/service-providers/me/bookings${query}`);
    },

    // Single booking detail
    async getBookingById(bookingId: number) {
        return apiFetch<ApiResponse<ProviderBookingDetail>>(`/service-providers/me/bookings/${bookingId}`);
    },

    // Update booking status
    async updateBookingStatus(bookingId: number, status: string) {
        return apiFetch<ApiResponse<{ booking_id: number; status: string }>>(
            `/service-providers/me/bookings/${bookingId}/status`,
            { method: 'PATCH', body: JSON.stringify({ status }) }
        );
    },

    // Services CRUD
    async getMyServices(isActive?: boolean) {
        const query = isActive !== undefined ? `?is_active=${isActive}` : '';
        return apiFetch<ApiResponse<Service[]>>(`/services/me${query}`);
    },

    async getServiceById(serviceId: number) {
        return apiFetch<ApiResponse<Service>>(`/services/${serviceId}`);
    },

    async createService(payload: ServiceFormPayload) {
        return apiFetch<ApiResponse<Service>>('/services', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    async updateService(serviceId: number, payload: Partial<ServiceFormPayload>) {
        return apiFetch<ApiResponse<Service>>(`/services/${serviceId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },

    async toggleServiceActive(serviceId: number) {
        return apiFetch<ApiResponse<Service>>(`/services/${serviceId}/toggle-active`, {
            method: 'PATCH',
        });
    },

    async deleteService(serviceId: number) {
        return apiFetch<ApiResponse<null>>(`/services/${serviceId}`, {
            method: 'DELETE',
        });
    },

    async getServiceCategories() {
        return apiFetch<ApiResponse<Array<{ service_category_id: number; name: string }>>>('/services/categories');
    },
};
