import { create } from 'zustand';
import api         from '../services/api';
import toast       from 'react-hot-toast';

const useAdminStore = create((set) => ({
  stats:      null,
  users:      [],
  books:      [],
  isLoading:  false,
  pagination: { page: 1, total: 0, pages: 1 },

  // ── fetchStats ─────────────────────────────────────────────────────────────
  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/admin/stats');
      set({ stats: data });
    } catch {}
    set({ isLoading: false });
  },

  // ── fetchUsers ─────────────────────────────────────────────────────────────
  fetchUsers: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/admin/users', { params });
      set({
        users: data.users ?? [],
        pagination: { page: data.page ?? 1, total: data.total ?? 0, pages: data.pages ?? 1 },
      });
    } catch {}
    set({ isLoading: false });
  },

  // ── updateUserRole ─────────────────────────────────────────────────────────
  updateUserRole: async (userId, role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role });
      set((s) => ({
        users: s.users.map((u) => (u._id === userId ? { ...u, role } : u)),
      }));
      toast.success('User role updated');
    } catch {
      toast.error('Could not update role');
    }
  },

  // ── deleteUser ─────────────────────────────────────────────────────────────
  deleteUser: async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      set((s) => ({ users: s.users.filter((u) => u._id !== userId) }));
      toast.success('User deleted');
    } catch {
      toast.error('Could not delete user');
    }
  },

  // ── fetchBooks ─────────────────────────────────────────────────────────────
  fetchBooks: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/admin/books', { params });
      set({
        books: data.books ?? [],
        pagination: { page: data.page ?? 1, total: data.total ?? 0, pages: data.pages ?? 1 },
      });
    } catch {}
    set({ isLoading: false });
  },

  // ── createBook ─────────────────────────────────────────────────────────────
  createBook: async (formData) => {
    try {
      const { data } = await api.post('/admin/books', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((s) => ({ books: [data.book, ...s.books] }));
      toast.success('Book created');
      return { ok: true };
    } catch {
      toast.error('Could not create book');
      return { ok: false };
    }
  },

  // ── updateBook ─────────────────────────────────────────────────────────────
  updateBook: async (bookId, formData) => {
    try {
      const { data } = await api.patch(`/admin/books/${bookId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set((s) => ({
        books: s.books.map((b) => (b._id === bookId ? data.book : b)),
      }));
      toast.success('Book updated');
      return { ok: true };
    } catch {
      toast.error('Could not update book');
      return { ok: false };
    }
  },

  // ── deleteBook ─────────────────────────────────────────────────────────────
  deleteBook: async (bookId) => {
    try {
      await api.delete(`/admin/books/${bookId}`);
      set((s) => ({ books: s.books.filter((b) => b._id !== bookId) }));
      toast.success('Book deleted');
    } catch {
      toast.error('Could not delete book');
    }
  },
}));

export default useAdminStore;
