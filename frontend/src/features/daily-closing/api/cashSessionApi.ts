import apiClient from '../../../services/apiClient';
import type { CashMovement, CashSession, ZReportData } from '../types/cashSessionTypes';
import type { PaginatedResponse } from '../../products/types/productTypes';

export const cashSessionApi = {
  getActiveSession: async (): Promise<CashSession | null> => {
    const response = await apiClient.get<{ success: boolean; data: CashSession | null }>('/cash-sessions/active');
    return response.data.data;
  },

  getSessions: async (params: { page?: number; status?: string; date_from?: string; date_to?: string; per_page?: number } = {}): Promise<PaginatedResponse<CashSession>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.status) searchParams.append('status', params.status);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get<PaginatedResponse<CashSession>>(`/cash-sessions?${searchParams.toString()}`);
    return response.data;
  },

  openSession: async (data: { opening_cash: number; notes?: string }): Promise<CashSession> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: CashSession }>('/cash-sessions/open', data);
    return response.data.data;
  },

  recordMovement: async (
    sessionId: number,
    data: { type: 'in' | 'out'; amount: number; reason: string; notes?: string }
  ): Promise<CashMovement> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: CashMovement }>(
      `/cash-sessions/${sessionId}/cash-movement`,
      data
    );
    return response.data.data;
  },

  closeSession: async (
    sessionId: number,
    data: { closing_cash_actual: number; notes?: string }
  ): Promise<{ session: CashSession; z_report: ZReportData }> => {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      data: CashSession;
      z_report: ZReportData;
    }>(`/cash-sessions/${sessionId}/close`, data);
    return { session: response.data.data, z_report: response.data.z_report };
  },

  getZReport: async (sessionId: number): Promise<ZReportData> => {
    const response = await apiClient.get<{ success: boolean; data: ZReportData }>(`/cash-sessions/${sessionId}/z-report`);
    return response.data.data;
  },
};
