import api from './api';

export const login    = (email, password)                => api.post('/auth/login',    { email, password }).then(r => r.data);
export const register = (name, email, password, language) => api.post('/auth/register', { name, email, password, language }).then(r => r.data);
export const google   = (idToken)                         => api.post('/auth/google',   { idToken }).then(r => r.data);
