import axios from 'axios';

// Base URL - update this to your backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Hospital APIs
export const hospitalApi = {
  getHospitals: (params) => apiClient.get('/hospitals', { params }),
  getHospitalById: (id) => apiClient.get(`/hospitals/${id}`),
};

// Transfer APIs
export const transferApi = {
  createTransfer: (data) => apiClient.post('/transfers', data),
  getTransfers: (params) => apiClient.get('/transfers', { params }),
  getTransferById: (id) => apiClient.get(`/transfers/${id}`),
  acknowledgeTransfer: (id) => apiClient.patch(`/transfers/${id}/acknowledge`),
};

// Auth APIs
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export default apiClient;
