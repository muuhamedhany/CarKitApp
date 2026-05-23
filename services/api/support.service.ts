import { apiFetch } from './client';
import { supabase } from '@/lib/supabase';
import { ApiResponse } from '@/types';

export interface SupportTicketData {
  subject: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  user_id_fk?: number;
}

export interface SupportTicket {
  ticket_id?: number;
  id?: number;
  user_id_fk?: number;
  subject?: string | null;
  message?: string | null;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export const supportService = {
  async getTickets(userId?: number): Promise<ApiResponse<SupportTicket[]>> {
    const query = userId ? `?user_id_fk=${userId}` : '';
    const endpoints = [`/supportTickets${query}`, `/support-tickets${query}`, `/support${query}`];

    for (const endpoint of endpoints) {
      try {
        const response = await apiFetch<ApiResponse<SupportTicket[]>>(endpoint);
        return {
          ...response,
          data: normalizeTickets(response.data),
        };
      } catch {
        // Try the next likely backend route, then fall back to Supabase.
      }
    }

    if (!userId) {
      return { success: true, message: 'No user selected.', data: [] };
    }

    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id_fk', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      success: true,
      message: 'Tickets loaded.',
      data: normalizeTickets(data),
    };
  },

  async createTicket(data: SupportTicketData): Promise<ApiResponse<SupportTicket>> {
    const apiPayload = {
      subject: data.subject,
      message: data.message,
      description: data.message,
      priority: data.priority,
      user_id_fk: data.user_id_fk,
    };
    const endpoints = ['/supportTickets', '/support-tickets', '/support'];

    for (const endpoint of endpoints) {
      try {
        return await apiFetch<ApiResponse<SupportTicket>>(endpoint, {
          method: 'POST',
          body: JSON.stringify(apiPayload),
        });
      } catch {
        // Try the next likely backend route, then fall back to Supabase.
      }
    }

    if (!data.user_id_fk) {
      throw new Error('Could not identify the current user.');
    }

    const { data: createdTicket, error } = await supabase
      .from('support_tickets')
      .insert({
        subject: data.subject,
        description: data.message,
        status: 'open',
        user_id_fk: data.user_id_fk,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Ticket created.',
      data: normalizeTicket(createdTicket),
    };
  }
};

function normalizeTickets(data?: SupportTicket[] | null): SupportTicket[] {
  return (data ?? []).map(normalizeTicket);
}

function normalizeTicket(ticket: SupportTicket): SupportTicket {
  return {
    ...ticket,
    message: ticket.message ?? ticket.description ?? '',
  };
}
