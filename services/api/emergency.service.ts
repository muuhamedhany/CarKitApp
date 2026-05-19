import { apiFetch } from './client';
import { ApiResponse, Service } from '@/types/api.types';
import { PaymentMethod } from './payment.service';

export type CoordinateValue = number | string | null;

export type EmergencyRequest = {
  request_id: number;
  service_id: number;
  service_name?: string;
  service_type?: string;
  status: 'searching' | 'accepted' | 'arrived' | 'completed' | 'expired' | 'cancelled' | string;
  customer_lat: CoordinateValue;
  customer_lng: CoordinateValue;
  latitude?: CoordinateValue;
  longitude?: CoordinateValue;
  customer_address?: string;
  payment_method: PaymentMethod | string;
  payment_status: string;
  expires_at: string;
  employee_full_name?: string;
  employee_name?: string;
  employee_phone?: string;
  employee_lat?: CoordinateValue;
  employee_lng?: CoordinateValue;
  employee_last_seen_at?: string;
  tracking_lat?: CoordinateValue;
  tracking_lng?: CoordinateValue;
  tracking_recorded_at?: string;
};

export type EmergencyEmployee = {
  employee_id: number;
  full_name: string;
  phone: string;
  service_ids: number[];
  is_online: boolean;
  cancellation_count: number;
};

export type EmergencyServiceOption = Service & {
  assigned_employee_count: number;
  online_employee_count: number;
};

export const emergencyService = {
  getServices() {
    return apiFetch<ApiResponse<EmergencyServiceOption[]>>('/emergency/services');
  },

  createRequest(payload: { service_id: number; lat: number; lng: number; customer_address?: string; payment_method: PaymentMethod }) {
    return apiFetch<ApiResponse<EmergencyRequest>>('/emergency/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyActiveRequest() {
    return apiFetch<ApiResponse<EmergencyRequest | null>>('/emergency/requests/my-active');
  },

  cancelRequest(requestId: number) {
    return apiFetch<ApiResponse<EmergencyRequest>>(`/emergency/requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  getEmployees() {
    return apiFetch<ApiResponse<EmergencyEmployee[]>>('/providers/me/employees');
  },

  createEmployee(payload: { full_name: string; phone: string; password: string; service_ids: number[] }) {
    return apiFetch<ApiResponse<EmergencyEmployee>>('/providers/me/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
