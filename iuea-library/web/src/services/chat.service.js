import api from './api';

export const sendMessage = (bookId, message, language = 'en') =>
  api.post(`/chat/${bookId}`, { message, language }).then((r) => r.data);

export const getChatHistory = (bookId) =>
  api.get(`/chat/${bookId}/history`).then((r) => r.data);
