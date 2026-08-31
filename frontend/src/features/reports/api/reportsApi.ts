import apiClient from '../../../services/apiClient';
import type { ProfitLossReport, SalesTaxReport, TopProductItem } from '../types/reportTypes';

type DateFilter = { date_from?: string; date_to?: string };

export const reportsApi = {
  getProfitLoss: async (filters: DateFilter = {}): Promise<ProfitLossReport> => {
    const params = new URLSearchParams();
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    const response = await apiClient.get<{ success: boolean; data: ProfitLossReport }>(
      `/reports/profit-loss?${params.toString()}`
    );
    return response.data.data;
  },

  getSalesTax: async (filters: DateFilter = {}): Promise<SalesTaxReport> => {
    const params = new URLSearchParams();
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    const response = await apiClient.get<{ success: boolean; data: SalesTaxReport }>(
      `/reports/sales-tax?${params.toString()}`
    );
    return response.data.data;
  },

  getTopProducts: async (limit = 10, filters: DateFilter = {}): Promise<TopProductItem[]> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    const response = await apiClient.get<{ success: boolean; data: TopProductItem[] }>(
      `/reports/top-products?${params.toString()}`
    );
    return response.data.data;
  },
};
