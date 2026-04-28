import { apiFetch } from './client';
import { ApiResponse } from '@/types/api.types';

export type PaymentMethod =
    | 'cash_on_delivery'
    | 'instapay'
    | 'vodafone_cash'
    | 'credit_card';

export interface PaymentPayload {
    order_id?: number;
    booking_id?: number;
    method: PaymentMethod;
    amount: number;
}

export interface PaymentRecord {
    payment_id: number;
    user_id_fk: number;
    order_id_fk: number | null;
    booking_id_fk: number | null;
    method: PaymentMethod;
    amount: string;
    status: string;
    created_at: string;
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
};
