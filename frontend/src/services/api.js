import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestPath = error.config?.url || '';
    const isAuthEndpoint = requestPath.includes('/auth/login') || requestPath.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      const isAlreadyOnPublicAuthPage =
        window.location.pathname === '/login' || window.location.pathname === '/register';

      if (!isAlreadyOnPublicAuthPage) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Mood API
export const moodAPI = {
  create: (data) => api.post('/moods', data),
  getAll: (params) => api.get('/moods', { params }),
  getById: (id) => api.get(`/moods/${id}`),
  update: (id, data) => api.put(`/moods/${id}`, data),
  delete: (id) => api.delete(`/moods/${id}`),
};

// Journal API
export const journalAPI = {
  create: (data) => api.post('/journals', data),
  getAll: (params) => api.get('/journals', { params }),
  getById: (id) => api.get(`/journals/${id}`),
  update: (id, data) => api.put(`/journals/${id}`, data),
  delete: (id) => api.delete(`/journals/${id}`),
};

// Insights API
export const insightsAPI = {
  getAll: () => api.get('/insights'),
};

// Resilience API
export const resilienceAPI = {
  calculate: () => api.post('/resilience/calculate'),
  getCurrent: () => api.get('/resilience/current'),
  getHistory: (params) => api.get('/resilience', { params }),
};

// Risk API
export const riskAPI = {
  evaluate: () => api.post('/risk/evaluate', {}),
  getHistory: () => api.get('/risk/history'),
  forecast: () => api.get('/risk/forecast'),
};

// Anonymous API
export const anonymousAPI = {
  create: (data) => api.post('/anonymous', data),
  getAll: (params) => api.get('/anonymous', { params }),
  addReaction: (id, reactionType) => api.post(`/anonymous/${id}/reaction`, { reactionType }),
};

// Task API
export const taskAPI = {
  getDaily: () => api.get('/tasks'),
  toggleTask: (taskId) => api.put(`/tasks/${taskId}`),
};

export default api;

