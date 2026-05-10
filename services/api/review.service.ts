import { apiFetch } from './client';
import { ApiResponse, Review, ReviewPayload } from '@/types/api.types';

export const reviewService = {
  /**
   * Submit a new review for a product, service, vendor, or provider.
   */
  async submitReview(payload: ReviewPayload) {
    return apiFetch<ApiResponse<Review>>('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get reviews for a specific vendor.
   */
  async getVendorReviews(vendorId: number) {
    return apiFetch<ApiResponse<Review[]>>(`/reviews/vendor/${vendorId}`);
  },

  /**
   * Get reviews for a specific provider.
   */
  async getProviderReviews(providerId: number) {
    return apiFetch<ApiResponse<Review[]>>(`/reviews/provider/${providerId}`);
  },

  /**
   * Get reviews for a specific product.
   */
  async getProductReviews(productId: number) {
    return apiFetch<ApiResponse<Review[]>>(`/reviews/product/${productId}`);
  },

  /**
   * Get reviews for a specific service.
   */
  async getServiceReviews(serviceId: number) {
    return apiFetch<ApiResponse<Review[]>>(`/reviews/service/${serviceId}`);
  },

  /**
   * Check if a specific order or booking has been reviewed.
   */
  async checkReviewStatus(context: { orderId?: number; bookingId?: number }) {
    const params = new URLSearchParams();
    if (context.orderId) params.append('orderId', context.orderId.toString());
    if (context.bookingId) params.append('bookingId', context.bookingId.toString());
    
    return apiFetch<ApiResponse<{ reviewed: boolean }>>(`/reviews/status?${params.toString()}`);
  }
};
