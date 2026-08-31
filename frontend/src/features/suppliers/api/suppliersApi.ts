import apiClient from '../../../services/apiClient';
import type { Supplier, SupplierTransaction } from '../types/supplierTypes';
import type { PaginatedResponse } from '../../products/types/productTypes';

export const suppliersApi = {
  getSuppliers: async (params: { page?: number; search?: string; has_debt?: boolean; per_page?: number } = {}): Promise<PaginatedResponse<Supplier>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.search) searchParams.append('search', params.search);
    if (params.has_debt !== undefined) searchParams.append('has_debt', String(params.has_debt));
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get<PaginatedResponse<Supplier>>(`/suppliers?${searchParams.toString()}`);
    return response.data;
  },

  getQuickList: async (): Promise<Supplier[]> => {
    const response = await apiClient.get<{ success: boolean; data: Supplier[] }>('/suppliers/quick-list');
    return response.data.data;
  },

  createSupplier: async (data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Supplier }>('/suppliers', data);
    return response.data.data;
  },

  updateSupplier: async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: Supplier }>(`/suppliers/${id}`, data);
    return response.data.data;
  },

  recordPayment: async (
    id: number,
    data: { amount: number; payment_method: string; notes?: string }
  ): Promise<{ transaction: SupplierTransaction; supplier: Supplier }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { transaction: SupplierTransaction; supplier: Supplier };
    }>(`/suppliers/${id}/payment`, data);
    return response.data.data;
  },

  deleteSupplier: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/suppliers/${id}`);
    return response.data;
  },
};
