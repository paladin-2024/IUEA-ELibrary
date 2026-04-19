import { create } from 'zustand';
import api         from '../services/api';

// ── Google Books helper ───────────────────────────────────────────────────────
async function _googleBooks(query, maxResults = 20) {
  try {
    const res  = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=${maxResults}&printType=books&orderBy=relevance`
    );
    if (!res.ok) return [];
    const data  = await res.json();
    return (data.items ?? [])
      .map((item) => {
        const info   = item.volumeInfo ?? {};
        const images = info.imageLinks ?? {};
        const raw    = images.thumbnail ?? images.smallThumbnail ?? '';
        const cover  = raw.replace('http://', 'https://');
        if (!cover) return null;
        const authors = Array.isArray(info.authors) ? info.authors : ['Unknown'];
        const cats    = Array.isArray(info.categories) ? info.categories : [];
        const year    = info.publishedDate;
        return {
          id:            `gb-${item.id}`,
          _id:           `gb-${item.id}`,
          title:         info.title ?? 'Unknown Title',
          author:        authors.join(', '),
          coverUrl:      cover,
          description:   info.description ?? null,
          category:      cats[0] ?? 'General',
          fileUrl:       info.previewLink ?? null,
          fileFormat:    'external',
          publishedYear: year ? parseInt(year.slice(0, 4)) : null,
          pageCount:     info.pageCount ?? null,
          languages:     [(info.language ?? 'en').toUpperCase()],
          ratingCount:   info.ratingsCount ?? 0,
          rating:        info.averageRating ?? 0,
          isExternal:    true,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

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
  homeLoading:     true,     // covers fetchNewest + fetchPopular on home page
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
    set({ homeLoading: true });
    try {
      const [serverRes, googleRes] = await Promise.allSettled([
        api.get('/books', { params: { sort: 'newest', limit: 12 } }),
        _googleBooks('east africa education university academic', 12),
      ]);
      const serverBooks = serverRes.status === 'fulfilled' ? (serverRes.value.data.books ?? []) : [];
      const googleBooks = googleRes.status === 'fulfilled' ? googleRes.value : [];
      const merged = serverBooks.length >= 6
        ? serverBooks
        : [...serverBooks, ...googleBooks.filter(g => !serverBooks.some(s => s.title === g.title))].slice(0, 12);
      set({ newestBooks: merged });
    } catch {}
    set({ homeLoading: false });
  },

  // ── fetchPopular ──────────────────────────────────────────────────────────────
  fetchPopular: async () => {
    try {
      const [serverRes, googleRes] = await Promise.allSettled([
        api.get('/books', { params: { sort: 'popular', limit: 10 } }),
        _googleBooks('bestseller academic popular university', 10),
      ]);
      const serverBooks = serverRes.status === 'fulfilled' ? (serverRes.value.data.books ?? []) : [];
      const googleBooks = googleRes.status === 'fulfilled' ? googleRes.value : [];
      const merged = serverBooks.length >= 3
        ? serverBooks
        : [...serverBooks, ...googleBooks.filter(g => !serverBooks.some(s => s.title === g.title))].slice(0, 10);
      set({ popularBooks: merged });
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
      const [serverRes, googleRes] = await Promise.allSettled([
        api.get('/books/search', { params: { q, ...filters } }),
        fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=40&printType=books`
        ).then((r) => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] })),
      ]);

      const serverData  = serverRes.status === 'fulfilled' ? serverRes.value.data : {};
      const serverBooks = serverData.books    ?? [];
      const serverExt   = serverData.external ?? [];

      // Map Google Books → internal shape
      const googleBooks = serverRes.status === 'fulfilled' && googleRes.status === 'fulfilled'
        ? (googleRes.value.items ?? []).map((item) => {
            const info   = item.volumeInfo ?? {};
            const images = info.imageLinks ?? {};
            const rawThumb = images.thumbnail ?? images.smallThumbnail ?? '';
            const thumb    = rawThumb.replace('http://', 'https://');
            const authors  = Array.isArray(info.authors) ? info.authors : ['Unknown'];
            const cats     = Array.isArray(info.categories) ? info.categories : [];
            const year     = info.publishedDate;
            return {
              id:            `gb-${item.id}`,
              title:         info.title ?? 'Unknown Title',
              author:        authors.join(', '),
              coverUrl:      thumb || null,
              description:   info.description ?? null,
              category:      cats[0] ?? filters.category ?? 'General',
              fileUrl:       info.previewLink ?? null,
              fileFormat:    'external',
              publishedYear: year ? parseInt(year.slice(0, 4)) : null,
              pageCount:     info.pageCount ?? null,
              languages:     [(info.language ?? 'en').toUpperCase()],
              isExternal:    true,
            };
          }).filter((b) => b.coverUrl)
        : [];

      // Deduplicate Google Books against server results
      const knownTitles = new Set([
        ...serverBooks.map((b) => b.title?.toLowerCase()),
        ...serverExt.map((b) => b.title?.toLowerCase()),
      ]);
      const uniqueGoogle = googleBooks.filter((b) => !knownTitles.has(b.title?.toLowerCase()));

      set({
        searchResults:   serverBooks,
        externalResults: [...serverExt, ...uniqueGoogle],
        pagination: {
          page:  serverData.page  ?? 1,
          total: serverData.total ?? 0,
          pages: serverData.pages ?? 1,
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
