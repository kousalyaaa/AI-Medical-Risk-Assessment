import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Define Assessment related types
export type AssessmentType = 'financial' | 'health' | 'environmental'; // Example types
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'; // Example types

export interface Assessment {
  id: string;
  user_id: string;
  assessment_type: AssessmentType;
  risk_level: RiskLevel;
  risk_score?: number;
  input_data?: any; // Legacy support
  assessment_data?: any; // Backend field name
  created_at: string;
}

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and network errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Network error (backend not running or connection failed)
    if (!error.response && error.request) {
      console.error('Network error: Backend may not be running');
      // Don't redirect on network errors for auth check - let AuthContext handle it
      if (error.config?.url?.includes('/auth/me')) {
        // This is handled in AuthContext
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      // Only redirect if not already on signin page
      if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
        window.location.href = '/signin';
      }
    }
    return Promise.reject(error);
  }
);
