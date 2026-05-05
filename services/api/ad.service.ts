import { apiFetch } from './client';
import { ApiResponse } from '@/types/api.types';

export interface Ad {
  ad_id: number;
  banner_image_url: string | null;
  title: string | null;
  search_keyword: string | null;
  duration_days: number;
  price: string;
  status: 'pending' | 'active' | 'expired' | 'rejected';
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  advertiser_name?: string;
  vendor_id?: number | null;
  provider_id?: number | null;
  target_product_ids?: number[];
  target_service_ids?: number[];
  target_category_ids?: number[];
}

export interface CreateAdPayload {
  banner_image_url: string | null;
  title?: string;
  duration_days: 7 | 14 | 30;
  price: number;
  search_keyword?: string;
  target_product_ids?: number[];
  target_service_ids?: number[];
  target_category_ids?: number[];
}

export const adService = {
  async getActiveAds() {
    return apiFetch<ApiResponse<Ad[]>>('/promotions/active');
  },

  async getMyAds() {
    return apiFetch<ApiResponse<Ad[]>>('/promotions/me');
  },

  async createAd(data: CreateAdPayload) {
    return apiFetch<ApiResponse<Ad>>('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
