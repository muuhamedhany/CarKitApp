import { apiFetch } from './client';
import { ApiResponse } from '@/types/api.types';

export interface BranchData {
  branch_id?: number;
  vendor_id?: number | null;
  provider_id?: number | null;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  is_main?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const branchService = {
  async getMyBranches() {
    return apiFetch<ApiResponse<BranchData[]>>('/branches/me');
  },

  async addBranch(data: Partial<BranchData>) {
    return apiFetch<ApiResponse<BranchData>>('/branches/me', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBranch(id: number, data: Partial<BranchData>) {
    return apiFetch<ApiResponse<BranchData>>(`/branches/me/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBranch(id: number) {
    return apiFetch<ApiResponse<any>>(`/branches/me/${id}`, {
      method: 'DELETE',
    });
  },

  async getVendorBranches(vendorId: number) {
    return apiFetch<ApiResponse<BranchData[]>>(`/branches/vendor/${vendorId}`);
  },

  async getProviderBranches(providerId: number) {
    return apiFetch<ApiResponse<BranchData[]>>(`/branches/provider/${providerId}`);
  },
};
