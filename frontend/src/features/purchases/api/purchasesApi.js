import apiClient from '../../../services/apiClient';

export const purchasesApi = {
  getPurchases: async (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.search) searchParams.append('search', params.search);
    if (params.payment_status) searchParams.append('payment_status', params.payment_status);
    if (params.purchase_status) searchParams.append('purchase_status', params.purchase_status);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get(`/purchases?${searchParams.toString()}`);
    return response.data;
  },

  getPurchase: async (id) => {
    const response = await apiClient.get(`/purchases/${id}`);
    return response.data.data;
  },

  createPurchase: async (payload) => {
    const response = await apiClient.post('/purchases', payload);
    return response.data.data;
  },

  voidPurchase: async (id, reason) => {
    const response = await apiClient.post(`/purchases/${id}/void`, {
      reason,
    });
    return response.data.data;
  },
};
