import { apiFetch } from './client';

export interface SupportTicketData {
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export const supportService = {
  async getTickets() {
    return apiFetch('/supportTickets');
  },

  async createTicket(data: SupportTicketData) {
    return apiFetch('/supportTickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
};
