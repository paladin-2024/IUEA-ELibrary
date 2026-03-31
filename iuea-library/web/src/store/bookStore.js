import { create } from 'zustand';
import api         from '../services/api';

const useBookStore = create((set) => ({
  // ── State ────────────────────────────────────────────────────────────────────
  featuredBook:    null,
  continueReading: [],
  newestBooks:     [],
  popularBooks:    [],
  books:           [],       // browse / search listing
  searchResults:   [],       // internal (MongoDB) search hits
  externalResults: [],       // Archive + Gutenberg hits
  currentBook:     null,
  isLoading:       false,
  searchLoading:   false,
  filters:         {},
  pagination:      { page: 1, total: 0, pages: 1 },

  // ── fetchFeatured ─────────────────────────────────────────────────────────────
  fetchFeatured: async () => {
    try {
      const { data } = await api.get('/books/featured');
      const list = data.books ?? [];
      set({ featuredBook: list[0] ?? null });
    } catch {}
  },

  // ── fetchContinueReading ──────────────────────────────────────────────────────
  fetchContinueReading: async () => {
    try {
      const { data } = await api.get('/books/continue');
      set({ continueReading: data.books ?? [] });
    } catch {
      // Silently ignore — user may not be logged in
    }
  },

  // ── fetchNewest ───────────────────────────────────────────────────────────────
  fetchNewest: async () => {
    try {
      const { data } = await api.get('/books', { params: { sort: 'newest', limit: 10 } });
      set({ newestBooks: data.books ?? [] });
    } catch {}
  },

  // ── fetchPopular ──────────────────────────────────────────────────────────────
  fetchPopular: async () => {
    try {
      const { data } = await api.get('/books', { params: { sort: 'popular', limit: 10 } });
      set({ popularBooks: data.books ?? [] });
    } catch {}
  },

  // ── fetchBooks (browse / paginated listing) ────────────────────────────────
  fetchBooks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/books', { params });
      set({
        books:      data.books ?? [],
        pagination: {
          page:  data.page  ?? 1,
          total: data.total ?? 0,
          pages: data.pages ?? 1,
        },
      });
    } catch {}
    set({ isLoading: false });
  },

  // ── searchBooks ───────────────────────────────────────────────────────────────
  searchBooks: async (q, filters = {}) => {
    set({ searchLoading: true, searchResults: [], externalResults: [] });
    try {
      const { data } = await api.get('/books/search', { params: { q, ...filters } });
      set({
        searchResults:   data.books    ?? [],
        externalResults: data.external ?? [],
        pagination: {
          page:  data.page  ?? 1,
          total: data.total ?? 0,
          pages: data.pages ?? 1,
        },
      });
    } catch {}
    set({ searchLoading: false });
  },

  // ── fetchBookById ─────────────────────────────────────────────────────────────
  fetchBookById: async (id) => {
    set({ isLoading: true, currentBook: null });
    try {
      const { data } = await api.get(`/books/${id}`);
      set({ currentBook: data.book });
    } catch {}
    set({ isLoading: false });
  },

  // ── setFilters ────────────────────────────────────────────────────────────────
  setFilters: (filters) => set({ filters }),
}));

export default useBookStore;
