import { create } from 'zustand';
import api         from '../services/api';

const useReaderStore = create((set, get) => ({
  // ── Book ─────────────────────────────────────────────────────────────────────
  currentBook:        null,

  // ── Reading position ─────────────────────────────────────────────────────────
  currentPage:        0,
  currentCfi:         '',
  currentChapter:     0,        // chapter index
  currentChapterText: '',       // plain text of current chapter for TTS/translation
  percentComplete:    0,

  // ── Mode ─────────────────────────────────────────────────────────────────────
  readingMode:        'read',   // 'read' | 'audio'

  // ── Language & translation ───────────────────────────────────────────────────
  readingLanguage:    'English',
  isTranslating:      false,
  translatedContent:  null,     // string — translated text for current chapter

  // ── Display settings ─────────────────────────────────────────────────────────
  fontSize:           18,
  lineHeight:         1.8,
  fontFamily:         'serif',  // 'serif' | 'sans' | 'mono'
  theme:              'white',  // 'white' | 'sepia' | 'dark'

  // ── Audio (Web Speech API) ───────────────────────────────────────────────────
  isPlaying:          false,
  isPaused:           false,
  playbackSpeed:      1,
  currentWordIndex:   -1,

  // ── UI overlay visibility ────────────────────────────────────────────────────
  showToolbar:        true,
  showTOC:            false,
  showChatbot:        false,
  showLanguageSwitcher: false,
  showFontPanel:      false,

  // ── Annotations ──────────────────────────────────────────────────────────────
  highlights: [],
  bookmarks:  [],

  // ── Setters ───────────────────────────────────────────────────────────────────
  setCurrentBook:      (book)  => set({ currentBook: book }),
  setCurrentPage:      (page)  => set({ currentPage: page }),
  setCurrentCfi:       (cfi)   => set({ currentCfi: cfi }),
  setCurrentChapter:   (idx)   => set({ currentChapter: idx, translatedContent: null }),
  setChapterText:      (text)  => set({ currentChapterText: text }),
  setPercentComplete:  (pct)   => set({ percentComplete: pct }),
  setReadingMode:      (mode)  => set({ readingMode: mode }),
  setReadingLanguage:  (lang)  => set({ readingLanguage: lang }),
  setIsTranslating:    (v)     => set({ isTranslating: v }),
  setTranslatedContent:(text)  => set({ translatedContent: text }),
  setFontSize:         (n)     => set({ fontSize: Math.max(12, Math.min(30, n)) }),
  setLineHeight:       (n)     => set({ lineHeight: n }),
  setFontFamily:       (f)     => set({ fontFamily: f }),
  setTheme:            (t)     => set({ theme: t }),
  setIsPlaying:        (v)     => set({ isPlaying: v }),
  setIsPaused:         (v)     => set({ isPaused: v }),
  setPlaybackSpeed:    (n)     => set({ playbackSpeed: n }),
  setCurrentWordIndex: (i)     => set({ currentWordIndex: i }),

  toggleToolbar:          () => set((s) => ({ showToolbar: !s.showToolbar })),
  toggleTOC:              () => set((s) => ({ showTOC: !s.showTOC, showChatbot: false, showLanguageSwitcher: false })),
  toggleChatbot:          () => set((s) => ({ showChatbot: !s.showChatbot, showTOC: false })),
  toggleLanguageSwitcher: () => set((s) => ({ showLanguageSwitcher: !s.showLanguageSwitcher })),
  toggleFontPanel:        () => set((s) => ({ showFontPanel: !s.showFontPanel })),

  addHighlight:    (h)   => set((s) => ({ highlights: [...s.highlights, h] })),
  addBookmark:     (cfi) => set((s) => ({ bookmarks:  [...s.bookmarks, cfi] })),
  removeHighlight: (cfi) => set((s) => ({ highlights: s.highlights.filter((h) => h.cfi !== cfi) })),
  removeBookmark:  (cfi) => set((s) => ({ bookmarks:  s.bookmarks.filter((c) => c !== cfi) })),

  // ── Sync actions ─────────────────────────────────────────────────────────────
  saveProgress: async (bookId) => {
    const {
      currentPage, currentCfi, percentComplete,
      currentChapter, readingLanguage, highlights, bookmarks,
    } = get();
    if (!bookId) return;
    try {
      await api.put(`/progress/${bookId}`, {
        currentPage,
        currentCfi,
        percentComplete,
        currentChapter,
        readingLanguage,
        highlights,
        bookmarks,
        device: 'web',
      });
    } catch (_) {
      // Silent — progress save failure is non-fatal
    }
  },

  loadProgress: async (bookId) => {
    if (!bookId) return;
    try {
      const { data } = await api.get(`/progress/${bookId}`);
      if (data.progress) {
        const p = data.progress;
        set({
          currentPage:     p.currentPage      ?? 0,
          currentCfi:      p.currentCfi       ?? '',
          currentChapter:  p.currentChapter   ?? 0,
          percentComplete: p.percentComplete  ?? 0,
          readingLanguage: p.readingLanguage  ?? 'English',
          highlights:      p.highlights       ?? [],
          bookmarks:       p.bookmarks        ?? [],
        });
      }
    } catch (_) {}
  },
}));

export default useReaderStore;
