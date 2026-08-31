import apiClient from '../../../services/apiClient';
import type { StoreSettings } from '../types/settingsTypes';

export const settingsApi = {
  getSettings: async (): Promise<StoreSettings> => {
    const response = await apiClient.get<{ success: boolean; data: StoreSettings }>('/settings');
    return response.data.data;
  },

  updateSettings: async (data: Partial<StoreSettings>): Promise<StoreSettings> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: StoreSettings }>('/settings', data);
    return response.data.data;
  },

  exportBackup: (): void => {
    const token = localStorage.getItem('auth_token') || '';
    const baseUrl = apiClient.defaults.baseURL ?? '';
    const link = document.createElement('a');
    link.href = `${baseUrl}/backup/export`;
    link.setAttribute('download', `store_backup_${new Date().toISOString().slice(0, 10)}.sql`);
    // pass auth header via query or fetch approach
    fetch(`${baseUrl}/backup/export`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `store_pos_backup_${new Date().toISOString().slice(0, 10)}.sql`;
        a.click();
        URL.revokeObjectURL(url);
      });
  },

  restoreBackup: async (file: File): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('backup_file', file);
    const response = await apiClient.post<{ success: boolean; message: string }>('/backup/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
