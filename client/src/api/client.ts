import axios from 'axios';

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL + '/api' : '/api'),
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post((import.meta.env.VITE_API_URL || '') + '/api/auth/refresh', { refreshToken });
        localStorage.setItem('access_token', data.data.accessToken);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);
