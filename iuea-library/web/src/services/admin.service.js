import api from './api';

// ── Stats ──────────────────────────────────────────────────────────────────────
export const getAdminStats = () => api.get('/admin/stats').then((r) => r.data);

// ── Users ──────────────────────────────────────────────────────────────────────
export const getUsers         = (params)         => api.get('/admin/users', { params }).then((r) => r.data);
export const updateUserRole   = (userId, role)   => api.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data);
export const deleteUser       = (userId)         => api.delete(`/admin/users/${userId}`).then((r) => r.data);
export const suspendUser      = (userId)         => api.patch(`/admin/users/${userId}/suspend`).then((r) => r.data);

// ── Books ──────────────────────────────────────────────────────────────────────
export const getAdminBooks    = (params)         => api.get('/admin/books', { params }).then((r) => r.data);
export const createBook       = (formData)       => api.post('/admin/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const updateBook       = (bookId, fData)  => api.patch(`/admin/books/${bookId}`, fData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const deleteBook       = (bookId)         => api.delete(`/admin/books/${bookId}`).then((r) => r.data);
export const toggleBookStatus = (bookId)         => api.patch(`/admin/books/${bookId}/toggle`).then((r) => r.data);

// ── Analytics ─────────────────────────────────────────────────────────────────
export const getAnalytics     = (range = '30d')  => api.get('/admin/analytics', { params: { range } }).then((r) => r.data);
export const getTopBooks      = ()               => api.get('/admin/analytics/top-books').then((r) => r.data);
export const getUserGrowth    = (range = '30d')  => api.get('/admin/analytics/user-growth', { params: { range } }).then((r) => r.data);

// ── Notifications ─────────────────────────────────────────────────────────────
export const sendPushNotification = (payload)    => api.post('/admin/notifications/push', payload).then((r) => r.data);
