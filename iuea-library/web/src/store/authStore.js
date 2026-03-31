import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('iuea_user') || 'null'),
  token: localStorage.getItem('iuea_token') || null,

  setAuth: (token, user) => {
    localStorage.setItem('iuea_token', token);
    localStorage.setItem('iuea_user',  JSON.stringify(user));
    set({ token, user });
  },

  updateUser: (updates) => {
    set((state) => {
      const updated = { ...state.user, ...updates };
      localStorage.setItem('iuea_user', JSON.stringify(updated));
      return { user: updated };
    });
  },

  logout: () => {
    localStorage.removeItem('iuea_token');
    localStorage.removeItem('iuea_user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => !!localStorage.getItem('iuea_token'),
}));

export default useAuthStore;
