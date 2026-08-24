import axios from 'axios';

// Exact Live Render Backend Primary URL
const EXACT_BACKEND_URL = 'https://cinepass-backend-2110.onrender.com/api';

const rawEnvUrl = import.meta.env.VITE_API_BASE_URL;

let API_BASE_URL = EXACT_BACKEND_URL;

if (rawEnvUrl && rawEnvUrl.includes('cinepass-backend-2110.onrender.com')) {
  API_BASE_URL = rawEnvUrl.trim();
} else if (
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
) {
  API_BASE_URL = 'http://localhost:5000/api';
} else {
  // Always default to live backend with -2110 suffix
  API_BASE_URL = EXACT_BACKEND_URL;
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
