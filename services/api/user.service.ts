import { apiFetch } from './client';

export const userService = {
  async getProfile() {
    return apiFetch('/users/profile');
  },

  async updateUser(data: { name?: string; phone?: string; profile_picture?: string }) {
    return apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async changePassword(data: { oldPassword?: string; newPassword: string }) {
    // Note: The specific route may vary based on backend implementation.
    // Generally, this is a PUT/PATCH to a password or user endpoint.
    return apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};
