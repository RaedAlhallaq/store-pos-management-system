import apiClient from '../../../services/apiClient';

export const customersApi = {
  getCustomers: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.search) searchParams.append('search', params.search);
    if (params.has_debt !== undefined) searchParams.append('has_debt', String(params.has_debt));
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get(`/customers?${searchParams.toString()}`);
    return response.data;
  },

  getQuickList: async () => {
    const response = await apiClient.get('/customers/quick-list');
    return response.data.data;
  },

  createCustomer: async (data) => {
    const response = await apiClient.post('/customers', data);
    return response.data.data;
  },

  updateCustomer: async (id, data) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data.data;
  },

  recordPayment: async (id, data) => {
    const response = await apiClient.post(`/customers/${id}/payment`, data);
    return response.data.data;
  },

  deleteCustomer: async (id) => {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },
};
