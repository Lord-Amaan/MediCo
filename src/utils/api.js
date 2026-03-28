import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Machine IP configured for API communication
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.0.124:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (handled by AuthContext now)
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error retrieving auth token:', error);
  }
  return config;
});

// Error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      AsyncStorage.removeItem('authToken');
    }
    return Promise.reject(error);
  }
);

// Hospital APIs
export const hospitalApi = {
  getHospitals: (params) => apiClient.get('/hospitals', { params }),
  getHospitalsByType: (type) => apiClient.get('/hospitals/type/' + type),
  getHospitalById: (id) => apiClient.get(`/hospitals/${id}`),
};

// Transfer APIs
export const transferApi = {
  createTransfer: (data) => apiClient.post('/transfers', data),
  getTransfers: (params) => apiClient.get('/transfers', { params }),
  getTransferById: (id) => apiClient.get(`/transfers/${id}`),
  getTransferByShareToken: (token) => apiClient.get(`/transfers/share/${token}`),
  acknowledgeTransfer: (id) => apiClient.put(`/transfers/${id}/acknowledge`),
  getTransferHistory: (patientID) => apiClient.get(`/transfers/patient/${patientID}`),
};

// Auth APIs
export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
};

export default apiClient;
