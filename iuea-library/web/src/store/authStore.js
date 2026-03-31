import { create }  from 'zustand';
import { persist } from 'zustand/middleware';
import api          from '../services/api';
import toast        from 'react-hot-toast';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:      null,
      token:     null,
      isLoading: false,
      error:     null,

      // ── login ──────────────────────────────────────────────────────────────
      login: async ({ email, password }) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ token: data.token, user: data.user, isLoading: false });
          return { ok: true, isNewUser: false };
        } catch (err) {
          const msg = err.response?.data?.message ?? 'Login failed.';
          set({ error: msg, isLoading: false });
          return { ok: false };
        }
      },

      // ── loginWithGoogle ────────────────────────────────────────────────────
      loginWithGoogle: async (idToken) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/google', { idToken });
          set({ token: data.token, user: data.user, isLoading: false });
          return { ok: true, isNewUser: data.isNewUser ?? false };
        } catch (err) {
          const msg = err.response?.data?.message ?? 'Google sign-in failed.';
          set({ error: msg, isLoading: false });
          return { ok: false };
        }
      },

      // ── register ───────────────────────────────────────────────────────────
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', userData);
          set({ token: data.token, user: data.user, isLoading: false });
          return { ok: true };
        } catch (err) {
          const msg = err.response?.data?.message ?? 'Registration failed.';
          set({ error: msg, isLoading: false });
          return { ok: false };
        }
      },

      // ── loadUser ───────────────────────────────────────────────────────────
      loadUser: async () => {
        if (!get().token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data });
        } catch {
          set({ token: null, user: null });
        }
      },

      // ── updateFcmToken ─────────────────────────────────────────────────────
      updateFcmToken: async (fcmToken) => {
        try {
          await api.post('/auth/fcm-token', { token: fcmToken, platform: 'web' });
        } catch {
          // Non-critical — swallow
        }
      },

      // ── logout ─────────────────────────────────────────────────────────────
      logout: () => {
        set({ token: null, user: null, error: null });
      },
    }),
    {
      name:    'iuea_auth',
      // Only persist token — user is re-fetched on mount via loadUser()
      partialize: (state) => ({ token: state.token }),
    }
  )
);

export default useAuthStore;
