import { apiFetch } from './client';

export interface AppNotification {
    notification_id: number;
    user_id: number;
    type: string;
    title: string;
    body: string | null;
    is_read: boolean;
    entity_type: string | null;
    entity_id: number | null;
    created_at: string;
}

export interface NotificationResponse {
    success: boolean;
    data?: AppNotification[];
    message?: string;
    page?: number;
    pageSize?: number;
    totalCount?: number;
    totalPages?: number;
}

export interface UnreadCountResponse {
    success: boolean;
    data?: {
        count: number;
    };
    message?: string;
}

class NotificationService {
    async getAll(page: number = 1, pageSize: number = 20): Promise<NotificationResponse> {
        return apiFetch(`/notifications?page=${page}&pageSize=${pageSize}`);
    }

    async getUnreadCount(): Promise<UnreadCountResponse> {
        return apiFetch('/notifications/unread-count');
    }

    async markAsRead(notificationId: number): Promise<{ success: boolean; message?: string }> {
        return apiFetch(`/notifications/${notificationId}/read`, {
            method: 'PATCH',
        });
    }

    async markAllAsRead(): Promise<{ success: boolean; message?: string }> {
        return apiFetch('/notifications/read-all', {
            method: 'PATCH',
        });
    }
    
    async remove(id: number): Promise<{ success: boolean; message?: string }> {
        return apiFetch(`/notifications/${id}`, {
            method: 'DELETE',
        });
    }

    async clearAll(): Promise<{ success: boolean; message?: string }> {
        return apiFetch('/notifications', {
            method: 'DELETE',
        });
    }
}

export const notificationService = new NotificationService();
