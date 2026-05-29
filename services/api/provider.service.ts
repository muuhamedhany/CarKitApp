import {
    ApiResponse,
    ProviderAnalyticsRange,
    ProviderAnalyticsResponse,
    ProviderBooking,
    ProviderBookingDetail,
    ProviderDashboardResponse,
    Service,
    ServiceFormPayload,
    ProviderPublicProfile,
} from '@/types/api.types';
import { apiFetch } from './client';

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

    async getProviderById(providerId: number) {
        try {
            // Fetch profile and services in parallel
            const [profileRes, servicesRes1, servicesRes2] = await Promise.all([
                apiFetch<ApiResponse<ProviderPublicProfile>>(`/service-providers/${providerId}`).catch(() => null),
                apiFetch<ApiResponse<Service[]>>(`/services?provider_id=${providerId}`).catch(() => null),
                apiFetch<ApiResponse<Service[]>>(`/services?provider_id_fk=${providerId}`).catch(() => null)
            ]);

            const profile = profileRes?.success ? profileRes.data : null;
            
            // Combine services and strictly verify they belong to this provider (checking all possible ID fields)
            const isMatch = (s: any, id: any) => {
                const sId = String(id);
                return String(s.provider_id) === sId || 
                       String(s.provider_id_fk) === sId || 
                       String(s.user_id) === sId || 
                       String(s.user_id_fk) === sId ||
                       String(s.vendor_id) === sId ||
                       String(s.vendor_id_fk) === sId;
            };

            let allServices: Service[] = [];
            if (servicesRes1?.success && servicesRes1.data) {
                const filtered = servicesRes1.data.filter(s => isMatch(s, providerId));
                allServices = [...allServices, ...filtered];
            }
            if (servicesRes2?.success && servicesRes2.data) {
                const existingIds = new Set(allServices.map(s => s.service_id));
                const filtered = servicesRes2.data.filter(s => isMatch(s, providerId) && !existingIds.has(s.service_id));
                allServices = [...allServices, ...filtered];
            }

            // Merge services into the profile and filter strictly
            if (profile) {
                const profileServices = Array.isArray(profile.services) ? profile.services : [];
                const mergedServices = [...allServices, ...profileServices];

                // Deduplicate and filter by ID (string safe)
                const finalServices = mergedServices.filter((s, index, self) => 
                    isMatch(s, providerId) &&
                    self.findIndex(t => t.service_id === s.service_id) === index
                );

                return {
                    success: true,
                    data: {
                        ...profile,
                        services: finalServices
                    }
                } as ApiResponse<ProviderPublicProfile>;
            }

            // If profile fetch failed but we have services
            if (allServices.length > 0) {
                return {
                    success: true,
                    data: {
                        provider_id: providerId,
                        name: allServices[0].provider_name || 'Service Provider',
                        services: allServices,
                        rating: allServices[0].rating || 0,
                        review_count: allServices[0].review_count || 0
                    }
                } as ApiResponse<ProviderPublicProfile>;
            }

            throw new Error('Provider not found');
        } catch (error) {
            console.error('[ProviderService] Error in getProviderById:', error);
            throw error;
        }
    },

    async updateProviderProfile(payload: {
        name?: string;
        contact_info?: string;
        profile_photo_url?: string | null;
    }) {
        return apiFetch<ApiResponse<any>>('/service-providers/me', {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    },
};
