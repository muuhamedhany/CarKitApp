import { apiFetch } from './client';

export interface AddressData {
  title: string;
  street: string;
  city: string;
  state?: string;
  zip_code?: string;
  details?: string;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
}

export const addressService = {
  async getAddresses() {
    return apiFetch('/addresses');
  },

  async addAddress(data: AddressData) {
    return apiFetch('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAddress(id: string, data: Partial<AddressData>) {
    return apiFetch(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAddress(id: string) {
    return apiFetch(`/addresses/${id}`, {
      method: 'DELETE',
    });
  }
};
