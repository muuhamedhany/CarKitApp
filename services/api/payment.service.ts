import { apiFetch } from './client';
import { ApiResponse } from '@/types/api.types';

export type PaymentMethod =
    | 'cash_on_delivery'
    | 'credit_card';

export interface PaymentPayload {
    order_id?: number;
    booking_id?: number;
    order_group_id?: number;
    method: PaymentMethod;
    amount: number;
}

export interface PaymentRecord {
    payment_id: number;
    user_id_fk: number;
    order_id_fk: number | null;
    booking_id_fk: number | null;
    order_group_id_fk?: number | null;
    method: PaymentMethod;
    amount: string;
    status: string;
    created_at: string;
}

export interface SavedPaymentMethod {
    payment_method_id: number;
    user_id_fk: number;
    type: 'credit_card';
    brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'card' | string;
    last4: string;
    expiry_month: number;
    expiry_year: number;
    holder_name: string;
    is_default: boolean;
    created_at: string;
    updated_at?: string;
}

export interface SavedPaymentMethodPayload {
    brand: string;
    last4: string;
    expiry_month: number;
    expiry_year: number;
    holder_name: string;
    is_default?: boolean;
}

export const paymentService = {
    async createPayment(data: PaymentPayload) {
        return apiFetch<ApiResponse<PaymentRecord>>('/payments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMyPayments() {
        return apiFetch<ApiResponse<PaymentRecord[]>>('/payments/my');
    },

    async getPaymentMethods() {
        return apiFetch<ApiResponse<SavedPaymentMethod[]>>('/payments/methods');
    },

    async addPaymentMethod(data: SavedPaymentMethodPayload) {
        return apiFetch<ApiResponse<SavedPaymentMethod>>('/payments/methods', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async setDefaultPaymentMethod(id: number) {
        return apiFetch<ApiResponse<SavedPaymentMethod>>(`/payments/methods/${id}/default`, {
            method: 'PATCH',
        });
    },

    async deletePaymentMethod(id: number) {
        return apiFetch<ApiResponse<{ payment_method_id: number }>>(`/payments/methods/${id}`, {
            method: 'DELETE',
        });
    },
};
