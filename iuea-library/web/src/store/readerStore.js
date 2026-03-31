import { create } from 'zustand';
import { READER_THEMES } from '../utils/constants';

const useReaderStore = create((set) => ({
  currentBook:  null,
  currentPage:  0,
  totalPages:   0,
  percentage:   0,
  currentCfi:   '',
  theme:        'light',
  fontSize:     16,
  isTtsPlaying: false,
  isChatOpen:   false,

  setBook:       (book) => set({ currentBook: book }),
  setPage:       (page, total) => set({ currentPage: page, totalPages: total, percentage: total ? Math.round((page / total) * 100) : 0 }),
  setCfi:        (cfi) => set({ currentCfi: cfi }),
  setTheme:      (theme) => set({ theme }),
  setFontSize:   (fontSize) => set({ fontSize }),
  setTtsPlaying: (isTtsPlaying) => set({ isTtsPlaying }),
  toggleChat:    () => set((s) => ({ isChatOpen: !s.isChatOpen })),

  getThemeStyles: () => {
    const theme = useReaderStore.getState().theme;
    return READER_THEMES[theme] || READER_THEMES.light;
  },
}));

export default useReaderStore;
