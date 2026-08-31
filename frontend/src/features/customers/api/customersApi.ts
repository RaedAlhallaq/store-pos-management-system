import apiClient from '../../../services/apiClient';
import type { Customer, CustomerTransaction } from '../types/customerTypes';
import type { PaginatedResponse } from '../../products/types/productTypes';

export const customersApi = {
  getCustomers: async (params: { page?: number; search?: string; has_debt?: boolean; per_page?: number } = {}): Promise<PaginatedResponse<Customer>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.search) searchParams.append('search', params.search);
    if (params.has_debt !== undefined) searchParams.append('has_debt', String(params.has_debt));
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get<PaginatedResponse<Customer>>(`/customers?${searchParams.toString()}`);
    return response.data;
  },

  getQuickList: async (): Promise<Customer[]> => {
    const response = await apiClient.get<{ success: boolean; data: Customer[] }>('/customers/quick-list');
    return response.data.data;
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Customer }>('/customers', data);
    return response.data.data;
  },

  updateCustomer: async (id: number, data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: Customer }>(`/customers/${id}`, data);
    return response.data.data;
  },

  recordPayment: async (
    id: number,
    data: { amount: number; payment_method: string; notes?: string }
  ): Promise<{ transaction: CustomerTransaction; customer: Customer }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { transaction: CustomerTransaction; customer: Customer };
    }>(`/customers/${id}/payment`, data);
    return response.data.data;
  },

  deleteCustomer: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/customers/${id}`);
    return response.data;
  },
};
