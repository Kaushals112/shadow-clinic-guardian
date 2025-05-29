
import axios from 'axios';
import { trackPotentialAttack } from './sessionTracker';

// Create axios instance
export const apiClient = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-honeypot-backend.com/api' 
    : 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor to add auth token and track requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add session ID to all requests
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['X-Session-ID'] = sessionId;
    }

    // Track API calls for honeypot analysis
    const requestData = {
      method: config.method?.toUpperCase(),
      url: config.url,
      timestamp: new Date(),
      headers: config.headers,
      data: config.data
    };

    // Store request for potential analysis
    const apiLogs = JSON.parse(localStorage.getItem('apiLogs') || '[]');
    apiLogs.push(requestData);
    if (apiLogs.length > 50) {
      apiLogs.splice(0, apiLogs.length - 50);
    }
    localStorage.setItem('apiLogs', JSON.stringify(apiLogs));

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and track responses
apiClient.interceptors.response.use(
  (response) => {
    // Track successful responses
    return response;
  },
  async (error) => {
    // Track potential attacks based on error patterns
    if (error.response?.status === 401) {
      await trackPotentialAttack('unauthorized_access', {
        url: error.config?.url,
        method: error.config?.method,
        timestamp: new Date()
      });
    }

    if (error.response?.status === 403) {
      await trackPotentialAttack('forbidden_access', {
        url: error.config?.url,
        method: error.config?.method,
        timestamp: new Date()
      });
    }

    // Handle token expiration
    if (error.response?.status === 401 && error.response?.data?.message === 'Token expired') {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
