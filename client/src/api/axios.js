import axios from 'axios';

// Production API Base URL fallback
const rawEnvUrl = import.meta.env.VITE_API_BASE_URL;

let API_BASE_URL = 'https://cinepass-backend.onrender.com/api';

if (rawEnvUrl && rawEnvUrl !== 'undefined' && rawEnvUrl !== 'null' && rawEnvUrl.trim() !== '') {
  API_BASE_URL = rawEnvUrl.trim();
} else if (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) {
  API_BASE_URL = 'http://localhost:5000/api';
}

console.log('[API Base URL]:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ticket_booking_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
