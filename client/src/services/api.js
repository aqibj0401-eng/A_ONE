import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('auth-storage');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed?.state?.token) {
          config.headers.Authorization = `Bearer ${parsed.state.token}`;
        }
      } catch (error) {
        console.error('Failed to parse auth token', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
