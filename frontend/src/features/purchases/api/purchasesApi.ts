import apiClient from '../../../services/apiClient';
import type { CreatePurchasePayload, Purchase } from '../types/purchaseTypes';
import type { PaginatedResponse } from '../../products/types/productTypes';

export const purchasesApi = {
  getPurchases: async (params: {
    page?: number;
    search?: string;
    payment_status?: string;
    purchase_status?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
  } = {}): Promise<PaginatedResponse<Purchase>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.search) searchParams.append('search', params.search);
    if (params.payment_status) searchParams.append('payment_status', params.payment_status);
    if (params.purchase_status) searchParams.append('purchase_status', params.purchase_status);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get<PaginatedResponse<Purchase>>(`/purchases?${searchParams.toString()}`);
    return response.data;
  },

  getPurchase: async (id: number): Promise<Purchase> => {
    const response = await apiClient.get<{ success: boolean; data: Purchase }>(`/purchases/${id}`);
    return response.data.data;
  },

  createPurchase: async (payload: CreatePurchasePayload): Promise<Purchase> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Purchase }>('/purchases', payload);
    return response.data.data;
  },

  voidPurchase: async (id: number, reason: string): Promise<Purchase> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Purchase }>(`/purchases/${id}/void`, {
      reason,
    });
    return response.data.data;
  },
};
