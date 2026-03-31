import api from './api';

export const listBooks = (params) =>
  api.get('/books', { params }).then((r) => r.data);

export const getFeatured = () =>
  api.get('/books/featured').then((r) => r.data);

export const searchBooks = (q, params = {}) =>
  api.get('/books/search', { params: { q, ...params } }).then((r) => r.data);

export const getBook = (id) =>
  api.get(`/books/${id}`).then((r) => r.data);

export const getSimilar = (id) =>
  api.get(`/books/${id}/similar`).then((r) => r.data);
