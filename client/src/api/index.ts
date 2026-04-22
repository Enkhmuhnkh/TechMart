import { apiClient } from './client';
import type { ProductFilters, ApiResponse, Product, Category, Brand, Cart, Order, User } from '../types';

// ─── AUTH ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    apiClient.post('/auth/register', data).then(r => r.data),

  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }).then(r => r.data),

  logout: () => apiClient.post('/auth/logout').then(r => r.data),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }).then(r => r.data),

  getMe: () => apiClient.get('/auth/me').then(r => r.data.data as User),

  updateMe: (data: { full_name?: string; phone?: string; language_pref?: string }) =>
    apiClient.patch('/auth/me', data).then(r => r.data.data as User),
};

// ─── PRODUCTS ──────────────────────────────────────────────────────────────
export const productsApi = {
  list: (filters: ProductFilters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    return apiClient.get(`/products?${params}`).then(r => r.data as { data: Product[]; meta: any });
  },

  getBySlug: (slug: string) =>
    apiClient.get(`/products/${slug}`).then(r => r.data.data as Product),

  compare: (ids: string[]) =>
    apiClient.get(`/products/compare?ids=${ids.join(',')}`).then(r => r.data.data as Product[]),

  getCategories: () =>
    apiClient.get('/categories').then(r => r.data.data as Category[]),

  getBrands: () =>
    apiClient.get('/brands').then(r => r.data.data as Brand[]),

  getReviews: (productId: string) =>
    apiClient.get(`/reviews/product/${productId}`).then(r => r.data.data),

  submitReview: (data: { product_id: string; rating: number; body: string }) =>
    apiClient.post('/reviews', data).then(r => r.data),

  deleteReview: (id: string) =>
    apiClient.delete(`/reviews/${id}`).then(r => r.data),
};

// ─── CART ──────────────────────────────────────────────────────────────────
export const cartApi = {
  get: () => apiClient.get('/cart').then(r => r.data.data as Cart),

  addItem: (product_id: string, quantity = 1) =>
    apiClient.post('/cart/items', { product_id, quantity }).then(r => r.data.data as Cart),

  updateItem: (itemId: string, quantity: number) =>
    apiClient.patch(`/cart/items/${itemId}`, { quantity }).then(r => r.data.data as Cart),

  removeItem: (itemId: string) =>
    apiClient.delete(`/cart/items/${itemId}`).then(r => r.data.data as Cart),

  clear: () => apiClient.delete('/cart').then(r => r.data.data as Cart),
};

// ─── ORDERS ────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (data: { shipping_address: object; payment_method: string }) =>
    apiClient.post('/orders', data).then(r => r.data.data as Order),

  list: (page = 1) =>
    apiClient.get(`/orders?page=${page}`).then(r => r.data),

  getById: (id: string) =>
    apiClient.get(`/orders/${id}`).then(r => r.data.data as Order),
};

// ─── WISHLIST ──────────────────────────────────────────────────────────────
export const wishlistApi = {
  get: () => apiClient.get('/wishlist').then(r => r.data.data),

  add: (product_id: string) =>
    apiClient.post('/wishlist', { product_id }).then(r => r.data),

  remove: (product_id: string) =>
    apiClient.delete(`/wishlist/${product_id}`).then(r => r.data),
};

// ─── AI ────────────────────────────────────────────────────────────────────
export const aiApi = {
  // Returns an EventSource-like stream
  chat: (message: string, sessionId?: string) => {
    return fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('access_token')
          ? { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
          : {}),
      },
      body: JSON.stringify({ message, sessionId }),
    });
  },

  getSession: (token: string) =>
    apiClient.get(`/ai/sessions/${token}`).then(r => r.data.data),

  clearSession: (token: string) =>
    apiClient.delete(`/ai/sessions/${token}`).then(r => r.data),
};

// ─── ADMIN ─────────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboard: () => apiClient.get('/admin/dashboard').then(r => r.data.data),
  getRevenueAnalytics: () => apiClient.get('/admin/analytics/revenue').then(r => r.data.data),
  getProductAnalytics: () => apiClient.get('/admin/analytics/products').then(r => r.data.data),
  getUserAnalytics: () => apiClient.get('/admin/analytics/users').then(r => r.data.data),
  getStockAnalytics: () => apiClient.get('/admin/analytics/stock').then(r => r.data.data),

  // Products
  listProducts: (params: any) => apiClient.get('/products', { params }).then(r => r.data),
  createProduct: (data: any) => apiClient.post('/products', data).then(r => r.data.data),
  updateProduct: (id: string, data: any) => apiClient.put(`/products/${id}`, data).then(r => r.data.data),
  deleteProduct: (id: string) => apiClient.delete(`/products/${id}`).then(r => r.data),
  updateSpecs: (id: string, specs: any[]) => apiClient.put(`/products/${id}/specs`, { specs }).then(r => r.data),
  uploadImage: (id: string, file: File, isPrimary: boolean) => {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('isPrimary', String(isPrimary));
    return apiClient.post(`/products/${id}/images`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data.data);
  },
  deleteImage: (productId: string, imageId: string) =>
    apiClient.delete(`/products/${productId}/images/${imageId}`).then(r => r.data),

  // Categories
  listCategories: () => apiClient.get('/categories').then(r => r.data.data),
  createCategory: (data: any) => apiClient.post('/categories', data).then(r => r.data.data),
  updateCategory: (id: string, data: any) => apiClient.put(`/categories/${id}`, data).then(r => r.data.data),
  deleteCategory: (id: string) => apiClient.delete(`/categories/${id}`).then(r => r.data),

  // Brands
  listBrands: () => apiClient.get('/brands').then(r => r.data.data),
  createBrand: (data: any) => apiClient.post('/brands', data).then(r => r.data.data),
  updateBrand: (id: string, data: any) => apiClient.put(`/brands/${id}`, data).then(r => r.data.data),
  deleteBrand: (id: string) => apiClient.delete(`/brands/${id}`).then(r => r.data),

  // Orders
  listOrders: (params: any) => apiClient.get('/admin/orders', { params }).then(r => r.data),
  updateOrderStatus: (id: string, status: string) =>
    apiClient.patch(`/admin/orders/${id}/status`, { status }).then(r => r.data.data),

  // Users
  listUsers: (params: any) => apiClient.get('/admin/users', { params }).then(r => r.data),
  updateUserRole: (id: string, role: string) =>
    apiClient.patch(`/admin/users/${id}/role`, { role }).then(r => r.data.data),

  // Reviews
  listReviews: (params: any) => apiClient.get('/admin/reviews', { params }).then(r => r.data),
  approveReview: (id: string) => apiClient.patch(`/admin/reviews/${id}/approve`).then(r => r.data.data),
  deleteReview: (id: string) => apiClient.delete(`/admin/reviews/${id}`).then(r => r.data),

  // Settings
  getSettings: () => apiClient.get('/admin/settings').then(r => r.data.data),
  saveSettings: (data: Record<string, string>) => apiClient.post('/admin/settings', data).then(r => r.data),
  getSaleProducts: () => apiClient.get('/admin/settings/sale-products').then(r => r.data.data),
};
