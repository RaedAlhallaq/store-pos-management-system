import apiClient from '../../../services/apiClient';
import type {
  Category,
  InventoryMetrics,
  PaginatedResponse,
  Product,
  ProductFilters,
  StockMovement,
  Unit,
} from '../types/productTypes';

export const productsApi = {
  // Products
  getProducts: async (filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.category_id && filters.category_id !== 'all') params.append('category_id', String(filters.category_id));
    if (filters.stock_status && filters.stock_status !== 'all') params.append('stock_status', filters.stock_status);
    if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.per_page) params.append('per_page', String(filters.per_page));

    const response = await apiClient.get<PaginatedResponse<Product>>(`/products?${params.toString()}`);
    return response.data;
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await apiClient.get<{ success: boolean; data: Product }>(`/products/${id}`);
    return response.data.data;
  },

  findByBarcode: async (barcode: string): Promise<Product> => {
    const response = await apiClient.get<{ success: boolean; data: Product }>(`/products/barcode/${barcode}`);
    return response.data.data;
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Product }>('/products', data);
    return response.data.data;
  },

  updateProduct: async (id: number, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: Product }>(`/products/${id}`, data);
    return response.data.data;
  },

  deleteProduct: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/products/${id}`);
    return response.data;
  },

  adjustStock: async (
    id: number,
    data: { type: string; quantity: number; notes?: string }
  ): Promise<{ movement: StockMovement; product: Product }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: { movement: StockMovement; product: Product };
    }>(`/products/${id}/adjust-stock`, data);
    return response.data.data;
  },

  getMetrics: async (): Promise<InventoryMetrics> => {
    const response = await apiClient.get<{ success: boolean; data: InventoryMetrics }>('/products/metrics');
    return response.data.data;
  },

  // Categories
  getCategories: async (activeOnly = false): Promise<Category[]> => {
    const response = await apiClient.get<{ data: Category[] }>(`/categories${activeOnly ? '?active_only=1' : ''}`);
    return response.data.data;
  },

  createCategory: async (data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.post<{ success: boolean; data: Category }>('/categories', data);
    return response.data.data;
  },

  updateCategory: async (id: number, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put<{ success: boolean; data: Category }>(`/categories/${id}`, data);
    return response.data.data;
  },

  deleteCategory: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/categories/${id}`);
    return response.data;
  },

  // Units
  getUnits: async (): Promise<Unit[]> => {
    const response = await apiClient.get<{ data: Unit[] }>('/units');
    return response.data.data;
  },

  createUnit: async (data: Partial<Unit>): Promise<Unit> => {
    const response = await apiClient.post<{ success: boolean; data: Unit }>('/units', data);
    return response.data.data;
  },

  updateUnit: async (id: number, data: Partial<Unit>): Promise<Unit> => {
    const response = await apiClient.put<{ success: boolean; data: Unit }>(`/units/${id}`, data);
    return response.data.data;
  },

  deleteUnit: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/units/${id}`);
    return response.data;
  },

  // Stock Movements
  getStockMovements: async (params: { product_id?: number; type?: string; page?: number; per_page?: number } = {}): Promise<PaginatedResponse<StockMovement>> => {
    const urlParams = new URLSearchParams();
    if (params.product_id) urlParams.append('product_id', String(params.product_id));
    if (params.type) urlParams.append('type', params.type);
    if (params.page) urlParams.append('page', String(params.page));
    if (params.per_page) urlParams.append('per_page', String(params.per_page));

    const response = await apiClient.get<PaginatedResponse<StockMovement>>(`/stock-movements?${urlParams.toString()}`);
    return response.data;
  },
};
