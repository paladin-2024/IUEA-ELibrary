import { create } from 'zustand';
import api from '../services/api';

export const READER_THEMES = {
  light: { background: '#FFFFFF', color: '#1A1A1A', borderColor: '#E5E7EB' },
  sepia: { background: '#F4E4C1', color: '#3D2B1F', borderColor: '#C9A77A' },
  dark:  { background: '#1A1A2E', color: '#E0E0E0', borderColor: '#374151' },
};

const useReaderStore = create((set, get) => ({
  // ── Book ─────────────────────────────────────────────────────────────────
  currentBook:        null,

  // ── Position ─────────────────────────────────────────────────────────────
  currentPage:        0,
  totalPages:         0,
  percentComplete:    0,
  currentCfi:         '',
  currentChapter:     '',
  currentChapterText: '',

  // ── Mode ─────────────────────────────────────────────────────────────────
  readingMode:        'read',    // 'read' | 'audio'
  readingLanguage:    'en',

  // ── Translation ───────────────────────────────────────────────────────────
  isTranslating:      false,
  translatedContent:  null,

  // ── Display ───────────────────────────────────────────────────────────────
  fontSize:           18,
  lineHeight:         1.6,
  fontFamily:         'serif',
  theme:              'light',

  // ── Audio ─────────────────────────────────────────────────────────────────
  isPlaying:          false,
  isPaused:           false,
  playbackSpeed:      1.0,
  currentWordIndex:   -1,

  // ── UI panels ─────────────────────────────────────────────────────────────
  showToolbar:        true,
  showTOC:            false,
  showChatbot:        false,
  showLanguageSwitcher: false,
  showFontPanel:      false,

  // ── Annotations ───────────────────────────────────────────────────────────
  highlights: [],
  bookmarks:  [],

  // ── Setters ───────────────────────────────────────────────────────────────
  setBook:            (b) => set({ currentBook: b }),
  setCfi:             (cfi) => set({ currentCfi: cfi }),
  setChapter:         (ch, text) => set({
    currentChapter: ch,
    currentChapterText: text ?? get().currentChapterText,
    translatedContent: null,
  }),
  setPage:            (page, total) => set({
    currentPage:     page,
    totalPages:      total,
    percentComplete: total > 0 ? Math.round((page / total) * 100) : 0,
  }),
  setReadingMode:     (mode) => set({ readingMode: mode }),
  setReadingLanguage: (lang) => set({ readingLanguage: lang, translatedContent: null }),
  setTranslating:     (v)    => set({ isTranslating: v }),
  setTranslatedContent: (c)  => set({ translatedContent: c }),
  setFontSize:        (n)    => set({ fontSize: Math.min(28, Math.max(12, n)) }),
  setLineHeight:      (n)    => set({ lineHeight: n }),
  setFontFamily:      (f)    => set({ fontFamily: f }),
  setTheme:           (t)    => set({ theme: t }),
  setIsPlaying:       (v)    => set({ isPlaying: v }),
  setIsPaused:        (v)    => set({ isPaused: v }),
  setPlaybackSpeed:   (n)    => set({ playbackSpeed: n }),
  setCurrentWordIndex:(i)    => set({ currentWordIndex: i }),

  toggleToolbar:      () => set((s) => ({ showToolbar: !s.showToolbar })),
  toggleTOC:          () => set((s) => ({ showTOC: !s.showTOC, showChatbot: false, showLanguageSwitcher: false })),
  toggleChatbot:      () => set((s) => ({ showChatbot: !s.showChatbot, showTOC: false })),
  toggleLanguageSwitcher: () => set((s) => ({ showLanguageSwitcher: !s.showLanguageSwitcher })),
  toggleFontPanel:    () => set((s) => ({ showFontPanel: !s.showFontPanel })),

  addHighlight:    (h)   => set((s) => ({ highlights: [...s.highlights, h] })),
  addBookmark:     (b)   => set((s) => ({ bookmarks:  [...s.bookmarks,  b] })),
  removeHighlight: (cfi) => set((s) => ({ highlights: s.highlights.filter((h) => h.cfi !== cfi) })),
  removeBookmark:  (cfi) => set((s) => ({ bookmarks:  s.bookmarks.filter((b)  => b.cfi  !== cfi) })),

  themeStyles: () => READER_THEMES[get().theme] || READER_THEMES.light,

  // ── Server sync ───────────────────────────────────────────────────────────
  saveProgress: async (bookId) => {
    const {
      currentPage, totalPages, percentComplete, currentCfi,
      currentChapter, readingLanguage, highlights, bookmarks,
    } = get();
    if (!bookId || currentPage === 0) return;
    try {
      await api.put(`/progress/${bookId}`, {
        currentPage,
        totalPages,
        percentComplete,
        currentCfi,
        currentChapter,
        readingLanguage,
        highlights,
        bookmarks,
        device: 'web',
      });
    } catch (_) {}
  },

  loadProgress: async (bookId) => {
    try {
      const { data } = await api.get(`/progress/${bookId}`);
      if (data.progress) {
        const p = data.progress;
        set({
          currentPage:     p.currentPage      || 0,
          totalPages:      p.totalPages       || 0,
          percentComplete: p.percentComplete  || 0,
          currentCfi:      p.currentCfi       || '',
          currentChapter:  p.currentChapter   || '',
          readingLanguage: p.readingLanguage  || 'en',
          highlights:      p.highlights       || [],
          bookmarks:       p.bookmarks        || [],
        });
      }
    } catch (_) {}
  },
}));

export default useReaderStore;
