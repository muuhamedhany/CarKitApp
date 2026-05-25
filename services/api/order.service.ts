import { apiFetch } from './client';
import { ApiResponse, OrderDetail, QueueInfo } from '@/types/api.types';

export interface OrderPayload {
    shipping_address_id?: number;
    preferred_delivery_date?: string;
    delivery_type?: 'home_delivery' | 'workshop_fitting';
    branch_id?: number;
    vendor_branches?: Record<number, number>;
}

export interface OrderRecord {
    order_id: number;
    order_group_id?: number | null;
    order_group_id_fk?: number | null;
    user_id_fk: number;
    shipping_address_fk: number | null;
    total_amount: string;
    status: string;
    order_date: string;
    preferred_delivery_date?: string | null;
    estimated_delivery_start?: string | null;
    estimated_delivery_end?: string | null;
    delivery_type?: 'home_delivery' | 'workshop_fitting' | string;
    vendor_id_fk?: number | null;
    vendor_name?: string | null;
    workshop_address?: string | null;
    workshop_latitude?: number | null;
    workshop_longitude?: number | null;
    workshop_service_fee?: number;
    branch_id_fk?: number | null;
    branch_name?: string | null;
    queue?: QueueInfo | null;
    orders?: OrderRecord[];
}

export type OrderDeliveryType = 'home_delivery' | 'workshop_fitting';

export const orderService = {
    async createOrder(data: OrderPayload) {
        return apiFetch<ApiResponse<OrderRecord>>('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async getMyOrders(status?: string, page: number = 1, pageSize: number = 10, deliveryType?: OrderDeliveryType) {
        const query = new URLSearchParams();
        if (status) query.append('status', status);
        if (deliveryType) query.append('delivery_type', deliveryType);
        query.append('page', page.toString());
        query.append('pageSize', pageSize.toString());
        return apiFetch<ApiResponse<OrderRecord[]>>(`/orders/my?${query.toString()}`);
    },

    async getOrderById(id: number) {
        return apiFetch<ApiResponse<OrderDetail>>(`/orders/${id}`);
    },

    async cancelOrder(id: number) {
        return apiFetch<ApiResponse<OrderRecord>>(`/orders/${id}/cancel`, {
            method: 'PATCH',
        });
    },

    async returnOrder(id: number) {
        return apiFetch<ApiResponse<OrderRecord>>(`/orders/${id}/return`, {
            method: 'PATCH',
        });
    },
};
