import { ApiResponse, Vehicle } from '@/types/api.types';
import { apiFetch } from './client';

export const vehicleService = {
  async getVehicles() {
    return apiFetch<ApiResponse<Vehicle[]>>('/vehicles');
  },

  async addVehicle(payload: Partial<Vehicle>) {
    return apiFetch<ApiResponse<Vehicle>>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getVehicleDetail(vehicleId: number) {
    const response = await apiFetch<ApiResponse<Vehicle[]>>('/vehicles');
    return {
      ...response,
      data: response.data?.find((vehicle) => vehicle.vehicle_id === vehicleId) || null,
    } as ApiResponse<Vehicle | null>;
  },

  async deleteVehicle(vehicleId: number) {
    return apiFetch<ApiResponse<null>>(`/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
  },
};
