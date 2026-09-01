import apiClient from '../../../services/apiClient';

export const authApi = {
  checkHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getUser: async () => {
    const response = await apiClient.get('/auth/user');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
};
