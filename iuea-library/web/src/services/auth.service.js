import api from './api';

export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (name, email, password, language = 'en') =>
  api.post('/auth/register', { name, email, password, language }).then((r) => r.data);

export const googleLogin = (idToken) =>
  api.post('/auth/google', { idToken }).then((r) => r.data);

export const getMe = () =>
  api.get('/auth/me').then((r) => r.data);

export const updateFcmToken = (fcmToken) =>
  api.post('/auth/fcm-token', { fcmToken }).then((r) => r.data);
