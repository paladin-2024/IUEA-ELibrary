import { create } from 'zustand';
import api         from '../services/api';
import toast       from 'react-hot-toast';

const useLibraryStore = create((set, get) => ({
  savedBooks:    [],
  highlights:    [],
  collections:   [],
  downloads:     [],
  isLoading:     false,

  // ── fetchSaved ─────────────────────────────────────────────────────────────
  fetchSaved: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/library/saved');
      set({ savedBooks: data.books ?? [] });
    } catch {}
    set({ isLoading: false });
  },

  // ── saveBook / unsaveBook ──────────────────────────────────────────────────
  saveBook: async (bookId) => {
    try {
      await api.post(`/library/save/${bookId}`);
      toast.success('Added to library');
      get().fetchSaved();
    } catch {
      toast.error('Could not save book');
    }
  },

  unsaveBook: async (bookId) => {
    try {
      await api.delete(`/library/save/${bookId}`);
      toast.success('Removed from library');
      set((s) => ({ savedBooks: s.savedBooks.filter((b) => b.id !== bookId) }));
    } catch {
      toast.error('Could not remove book');
    }
  },

  // ── highlights ─────────────────────────────────────────────────────────────
  fetchHighlights: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/library/highlights');
      set({ highlights: data.highlights ?? [] });
    } catch {}
    set({ isLoading: false });
  },

  deleteHighlight: async (bookId, highlightId) => {
    try {
      await api.delete(`/library/highlights/${bookId}/${highlightId}`);
      set((s) => ({ highlights: s.highlights.filter((h) => h.id !== highlightId) }));
      toast.success('Highlight deleted');
    } catch {
      toast.error('Could not delete highlight');
    }
  },

  // ── collections ────────────────────────────────────────────────────────────
  fetchCollections: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/library/collections');
      set({ collections: data.collections ?? [] });
    } catch {}
    set({ isLoading: false });
  },

  createCollection: async (name) => {
    try {
      const { data } = await api.post('/library/collections', { name });
      set((s) => ({ collections: [...s.collections, data.collection] }));
      toast.success('Collection created');
    } catch {
      toast.error('Could not create collection');
    }
  },

  addToCollection: async (collectionId, bookId) => {
    try {
      await api.post(`/library/collections/${collectionId}/books`, { bookId });
      toast.success('Added to collection');
      get().fetchCollections();
    } catch {
      toast.error('Could not add to collection');
    }
  },

  deleteCollection: async (collectionId) => {
    try {
      await api.delete(`/library/collections/${collectionId}`);
      set((s) => ({ collections: s.collections.filter((c) => c.id !== collectionId) }));
      toast.success('Collection deleted');
    } catch {
      toast.error('Could not delete collection');
    }
  },

  // ── downloads ──────────────────────────────────────────────────────────────
  fetchDownloads: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/library/downloads');
      set({ downloads: data.downloads ?? [] });
    } catch {}
    set({ isLoading: false });
  },

  removeDownload: async (bookId) => {
    try {
      await api.delete(`/library/downloads/${bookId}`);
      set((s) => ({ downloads: s.downloads.filter((d) => d.id !== bookId) }));
      toast.success('Download removed');
    } catch {
      toast.error('Could not remove download');
    }
  },
}));

export default useLibraryStore;
