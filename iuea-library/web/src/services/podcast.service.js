import api from './api';

export const listPodcasts = (params) =>
  api.get('/podcasts', { params }).then((r) => r.data);

export const getPodcast = (id) =>
  api.get(`/podcasts/${id}`).then((r) => r.data);

export const toggleSubscribe = (id) =>
  api.post(`/podcasts/subscribe/${id}`).then((r) => r.data);
