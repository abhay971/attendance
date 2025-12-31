import api from './axios';

export const adminApi = {
  // Employees
  createEmployee: async (data) => {
    const response = await api.post('/admin/employees', data);
    return response.data.data;
  },

  getEmployees: async (params = {}) => {
    const response = await api.get('/admin/employees', { params });
    return response.data.data;
  },

  getEmployee: async (id) => {
    const response = await api.get(`/admin/employees/${id}`);
    return response.data.data;
  },

  updateEmployee: async (id, data) => {
    const response = await api.put(`/admin/employees/${id}`, data);
    return response.data.data;
  },

  deleteEmployee: async (id) => {
    const response = await api.delete(`/admin/employees/${id}`);
    return response.data;
  },

  // Attendance
  getAllAttendance: async (params = {}) => {
    const response = await api.get('/admin/attendance', { params });
    return response.data.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data.data;
  },

  getWeeklyStats: async () => {
    const response = await api.get('/admin/dashboard/weekly');
    return response.data.data;
  },

  getDepartmentStats: async () => {
    const response = await api.get('/admin/dashboard/departments');
    return response.data.data;
  },

  getEmployeesNotCheckedIn: async () => {
    const response = await api.get('/admin/dashboard/not-checked-in');
    return response.data.data;
  },

  getEmployeesNeedingCheckOut: async () => {
    const response = await api.get('/admin/dashboard/need-checkout');
    return response.data.data;
  },

  getEmployeeAttendance: async (employeeId, params = {}) => {
    const response = await api.get(`/admin/employees/${employeeId}/attendance`, { params });
    return response.data.data;
  },
};
