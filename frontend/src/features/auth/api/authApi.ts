import apiClient from '../../../services/apiClient';
import type { ApiHealthResponse, ApiResponse, User } from '../../../types';
import type { AuthResponse, LoginCredentials } from '../types/authTypes';

export const authApi = {
  /**
   * Health Check
   */
  checkHealth: async (): Promise<ApiHealthResponse> => {
    const response = await apiClient.get<ApiHealthResponse>('/health');
    return response.data;
  },

  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get authenticated user
   */
  getUser: async (): Promise<{ success: boolean; user: User }> => {
    const response = await apiClient.get<{ success: boolean; user: User }>('/auth/user');
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<ApiResponse> => {
    const response = await apiClient.post<ApiResponse>('/auth/logout');
    return response.data;
  },
};
