import api, { getRefreshToken } from './axios';

export const authApi = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data.data;
  },

  refresh: async () => {
    const refreshToken = getRefreshToken();
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  logout: async () => {
    const refreshToken = getRefreshToken();
    const response = await api.post('/auth/logout', { refreshToken });
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
};
