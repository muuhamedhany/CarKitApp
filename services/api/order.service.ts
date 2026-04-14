import { apiFetch } from './client';
import { ApiResponse } from '@/types/api.types';

export interface OrderPayload {
    shipping_address_id?: number;
}

export interface OrderRecord {
    order_id: number;
    user_id_fk: number;
    shipping_address_fk: number | null;
    total_amount: string;
    status: string;
    order_date: string;
}

export const orderService = {
    async createOrder(data: OrderPayload) {
        return apiFetch<ApiResponse<OrderRecord>>('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMyOrders() {
        return apiFetch<ApiResponse<OrderRecord[]>>('/orders/my');
    },

    async getOrderById(id: number) {
        return apiFetch<ApiResponse<OrderRecord>>(`/orders/${id}`);
    },
};
