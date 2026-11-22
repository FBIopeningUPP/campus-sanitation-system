import axios from 'axios';

// Use relative /api path for Vercel deployment, fallback to localhost for dev
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Buildings API
export const buildingsApi = {
  getAll: () => api.get('/buildings'),
  getById: (id) => api.get(`/buildings/${id}`),
  create: (data) => api.post('/buildings', data),
  update: (id, data) => api.put(`/buildings/${id}`, data),
  delete: (id) => api.delete(`/buildings/${id}`),
};

// Floors API
export const floorsApi = {
  getAll: (buildingId) => api.get('/floors', { params: { building_id: buildingId } }),
  getById: (id) => api.get(`/floors/${id}`),
  create: (data) => api.post('/floors', data),
  update: (id, data) => api.put(`/floors/${id}`, data),
  delete: (id) => api.delete(`/floors/${id}`),
};

// Washrooms API
export const washroomsApi = {
  getAll: (params) => api.get('/washrooms', { params }),
  getById: (id) => api.get(`/washrooms/${id}`),
  getByQR: (qrCode) => api.get(`/washrooms/qr/${qrCode}`),
  getRankings: (params) => api.get('/washrooms/rankings', { params }),
  create: (data) => api.post('/washrooms', data),
  update: (id, data) => api.put(`/washrooms/${id}`, data),
  delete: (id) => api.delete(`/washrooms/${id}`),
};

// Ratings API
export const ratingsApi = {
  getByWashroom: (washroomId, params) => api.get(`/ratings/washroom/${washroomId}`, { params }),
  getDistribution: (washroomId) => api.get(`/ratings/distribution/${washroomId}`),
  submit: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/ratings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Issues API
export const issuesApi = {
  getAll: (params) => api.get('/issues', { params }),
  getById: (id) => api.get(`/issues/${id}`),
  report: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return api.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  updateStatus: (id, status) => api.put(`/issues/${id}/status`, { status }),
  updatePriority: (id, priority) => api.put(`/issues/${id}/priority`, { priority }),
  delete: (id) => api.delete(`/issues/${id}`),
};

// Auth API
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
};

// Admin API
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  exportRatings: (params) => api.get('/admin/export/ratings', { params, responseType: 'blob' }),
  exportIssues: (params) => api.get('/admin/export/issues', { params, responseType: 'blob' }),
};

// Analytics API
export const analyticsApi = {
  getRatingsTrend: (params) => api.get('/analytics/ratings-trend', { params }),
  getIssuesTrend: (params) => api.get('/analytics/issues-trend', { params }),
  getIssueTypes: (params) => api.get('/analytics/issue-types', { params }),
  getBuildingStats: () => api.get('/analytics/building-stats'),
  getRatingDistribution: (params) => api.get('/analytics/rating-distribution', { params }),
  getResponseTime: () => api.get('/analytics/response-time'),
};

export default api;
