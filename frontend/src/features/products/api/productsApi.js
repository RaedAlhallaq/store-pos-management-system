import apiClient from '../../../services/apiClient';

export const productsApi = {
  // Products
  getProducts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id && filters.category_id !== 'all') params.append('category_id', String(filters.category_id));
    if (filters.stock_status && filters.stock_status !== 'all') params.append('stock_status', filters.stock_status);
    if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.per_page) params.append('per_page', String(filters.per_page));

    const response = await apiClient.get(`/products?${params.toString()}`);
    return response.data;
  },

  getProduct: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data.data;
  },

  findByBarcode: async (barcode) => {
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response.data.data;
  },

  createProduct: async (data) => {
    const response = await apiClient.post('/products', data);
    return response.data.data;
  },

  updateProduct: async (id, data) => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data.data;
  },

  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  adjustStock: async (id, data) => {
    const response = await apiClient.post(`/products/${id}/adjust-stock`, data);
    return response.data.data;
  },

  getMetrics: async () => {
    const response = await apiClient.get('/products/metrics');
    return response.data.data;
  },

  // Categories
  getCategories: async (activeOnly = false) => {
    const response = await apiClient.get(`/categories${activeOnly ? '?active_only=1' : ''}`);
    return response.data.data;
  },

  createCategory: async (data) => {
    const response = await apiClient.post('/categories', data);
    return response.data.data;
  },

  updateCategory: async (id, data) => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data.data;
  },

  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data;
  },

  // Units
  getUnits: async () => {
    const response = await apiClient.get('/units');
    return response.data.data;
  },

  createUnit: async (data) => {
    const response = await apiClient.post('/units', data);
    return response.data.data;
  },

  updateUnit: async (id, data) => {
    const response = await apiClient.put(`/units/${id}`, data);
    return response.data.data;
  },

  deleteUnit: async (id) => {
    const response = await apiClient.delete(`/units/${id}`);
    return response.data;
  },

  // Stock Movements
  getStockMovements: async (params = {}) => {
    const urlParams = new URLSearchParams();
    if (params.product_id) urlParams.append('product_id', String(params.product_id));
    if (params.type) urlParams.append('type', params.type);
    if (params.page) urlParams.append('page', String(params.page));
    if (params.per_page) urlParams.append('per_page', String(params.per_page));

    const response = await apiClient.get(`/stock-movements?${urlParams.toString()}`);
    return response.data;
  },
};
