import api from './axios';

export const attendanceApi = {
  checkIn: async (lat, lng, notes) => {
    const response = await api.post('/attendance/check-in', { lat, lng, notes });
    return response.data.data;
  },

  checkOut: async (lat, lng, notes) => {
    const response = await api.post('/attendance/check-out', { lat, lng, notes });
    return response.data.data;
  },

  getStatus: async () => {
    const response = await api.get('/attendance/status');
    return response.data.data;
  },

  getHistory: async (params = {}) => {
    const response = await api.get('/attendance/history', { params });
    return response.data.data;
  },

  getStats: async () => {
    const response = await api.get('/attendance/stats');
    return response.data.data;
  },
};
