import axios from 'axios';

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    API_BASE_URL = 'https://cinepass-backend.onrender.com/api';
  } else {
    API_BASE_URL = 'http://localhost:5000/api';
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
