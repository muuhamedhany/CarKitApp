import { ApiResponse, QueueInfo } from '@/types/api.types';
import { apiFetch } from './client';
import { PaymentMethod } from './payment.service';

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
  payment_method?: PaymentMethod;
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
  provider_id_fk?: number;
  service_id_fk?: number;
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
  apartment_floor?: string;
  building?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  queue?: QueueInfo | null;
};

export const bookingService = {
  // Customer: Create booking
  async createBooking(payload: BookingPayload) {
    return apiFetch<ApiResponse<{ booking_id: number; queue?: QueueInfo | null }>>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Customer: Get my bookings
  async getMyBookings(status?: string, page: number = 1, pageSize: number = 10) {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    query.append('page', page.toString());
    query.append('pageSize', pageSize.toString());
    return apiFetch<ApiResponse<Booking[]>>(`/bookings/my?${query.toString()}`);
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
  async getProviderBookings(status?: string, date?: string, page: number = 1, pageSize: number = 10, search?: string) {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    if (date) params.append('date', date);
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
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
