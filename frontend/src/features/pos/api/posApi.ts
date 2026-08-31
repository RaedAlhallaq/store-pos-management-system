import apiClient from '../../../services/apiClient';
import type { CheckoutPayload, SaleResponse } from '../types/posTypes';
import type { PaginatedResponse } from '../../products/types/productTypes';

export const posApi = {
  checkout: async (payload: CheckoutPayload): Promise<SaleResponse> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: SaleResponse }>('/sales', payload);
    return response.data.data;
  },

  getSales: async (params: {
    page?: number;
    search?: string;
    payment_status?: string;
    invoice_status?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
  } = {}): Promise<PaginatedResponse<SaleResponse>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.search) searchParams.append('search', params.search);
    if (params.payment_status) searchParams.append('payment_status', params.payment_status);
    if (params.invoice_status) searchParams.append('invoice_status', params.invoice_status);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get<PaginatedResponse<SaleResponse>>(`/sales?${searchParams.toString()}`);
    return response.data;
  },

  getSale: async (id: number): Promise<SaleResponse> => {
    const response = await apiClient.get<{ success: boolean; data: SaleResponse }>(`/sales/${id}`);
    return response.data.data;
  },

  voidSale: async (id: number, reason: string): Promise<SaleResponse> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: SaleResponse }>(`/sales/${id}/void`, {
      reason,
    });
    return response.data.data;
  },
};
