import { apiFetch } from './client';
import { ApiResponse } from '@/types/api.types';

export type BookingPayload = {
  service_id: number;
  vehicle_id?: number;
  provider_id?: number;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  booking_price: number;
  address_id?: number;
  payment_method?: string;
};

export type Booking = {
  booking_id: number;
  status: string;
  booking_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  booking_price: string | number;
  service_name: string;
  service_description?: string;
  service_duration?: number;
  provider_name?: string;
  provider_phone?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  vehicle_year?: number;
  model_name?: string;
  make_name?: string;
  vehicle_color?: string;
  address_title?: string;
  street?: string;
  city?: string;
};

export const bookingService = {
  // Customer: Create booking
  async createBooking(payload: BookingPayload) {
    return apiFetch<ApiResponse<{ booking_id: number }>>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Customer: Get my bookings
  async getMyBookings() {
    return apiFetch<ApiResponse<Booking[]>>('/bookings/my');
  },

  // Customer: Get single booking
  async getBookingById(bookingId: number) {
    return apiFetch<ApiResponse<Booking>>(`/bookings/${bookingId}`);
  },

  // Customer: Cancel booking
  async cancelBooking(bookingId: number) {
    return apiFetch<ApiResponse<Booking>>(`/bookings/${bookingId}/cancel`, {
      method: 'PATCH',
    });
  },

  // Provider: Get my bookings
  async getProviderBookings(status?: string, date?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (date) params.append('date', date);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiFetch<ApiResponse<Booking[]>>(`/bookings/provider/me${query}`);
  },

  // Provider: Get single booking detail
  async getProviderBookingById(bookingId: number) {
    return apiFetch<ApiResponse<Booking>>(`/bookings/provider/me/${bookingId}`);
  },

  // Provider: Update booking status
  async updateProviderBookingStatus(bookingId: number, status: string) {
    return apiFetch<ApiResponse<Booking>>(`/bookings/provider/me/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
