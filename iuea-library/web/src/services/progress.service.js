import api from './api';

export const saveProgress = (bookId, data) =>
  api.put(`/progress/${bookId}`, data).then((r) => r.data);

export const getProgress = (bookId) =>
  api.get(`/progress/${bookId}`).then((r) => r.data);

export const getAllProgress = () =>
  api.get('/progress').then((r) => r.data);
