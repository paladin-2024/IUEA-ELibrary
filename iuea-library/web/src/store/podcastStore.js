import { create } from 'zustand';
import api         from '../services/api';

const usePodcastStore = create((set, get) => ({
  podcasts:       [],
  currentPodcast: null,
  episodes:       [],
  currentEpisode: null,
  isLoading:      false,
  pagination:     { page: 1, total: 0, pages: 1 },

  // ── fetchPodcasts ──────────────────────────────────────────────────────────
  fetchPodcasts: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/podcasts', { params });
      set({
        podcasts:   data.podcasts ?? [],
        pagination: { page: data.page ?? 1, total: data.total ?? 0, pages: data.pages ?? 1 },
      });
    } catch {}
    set({ isLoading: false });
  },

  // ── fetchPodcastById ───────────────────────────────────────────────────────
  fetchPodcastById: async (id) => {
    set({ isLoading: true, currentPodcast: null, episodes: [] });
    try {
      const { data } = await api.get(`/podcasts/${id}`);
      set({ currentPodcast: data.podcast, episodes: data.episodes ?? [] });
    } catch {}
    set({ isLoading: false });
  },

  // ── fetchEpisode ───────────────────────────────────────────────────────────
  fetchEpisode: async (podcastId, episodeId) => {
    set({ isLoading: true, currentEpisode: null });
    try {
      const { data } = await api.get(`/podcasts/${podcastId}/episodes/${episodeId}`);
      set({ currentEpisode: data.episode });
    } catch {}
    set({ isLoading: false });
  },

  // ── setCurrentEpisode ──────────────────────────────────────────────────────
  setCurrentEpisode: (episode) => set({ currentEpisode: episode }),

  // ── clearCurrent ──────────────────────────────────────────────────────────
  clearCurrent: () => set({ currentPodcast: null, currentEpisode: null, episodes: [] }),
}));

export default usePodcastStore;
