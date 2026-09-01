import apiClient from '../../../services/apiClient';

export const posApi = {
  async checkout(payload) {
    const response = await apiClient.post('/sales', payload);
    return response.data.data;
  },
  async getSales(params = {}) {
    const searchParams = new URLSearchParams();
    ['page', 'search', 'payment_status', 'invoice_status', 'date_from', 'date_to', 'per_page'].forEach((key) => {
      if (params[key]) searchParams.append(key, String(params[key]));
    });
    const response = await apiClient.get(`/sales?${searchParams.toString()}`);
    return response.data;
  },
  async getSale(id) {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data.data;
  },
  async voidSale(id, reason) {
    const response = await apiClient.post(`/sales/${id}/void`, { reason });
    return response.data.data;
  },
};
