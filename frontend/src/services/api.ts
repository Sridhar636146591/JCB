import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout — allows Render free tier cold starts (~30-50s) to respond
});

// Request interceptor to attach JWT token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Keep-alive ping: hits /auth/me every 10 minutes to prevent Render cold starts
const startKeepAlive = () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  api.get('/auth/me').catch(() => {}); // silent ping
};

setInterval(startKeepAlive, 10 * 60 * 1000); // every 10 minutes

export default api;
