import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link }             from 'react-router-dom';
import { MdSearchOff }   from 'react-icons/md';
import { FiSearch, FiX } from 'react-icons/fi';
import useBookStore from '../../store/bookStore';
import BookCard     from '../../components/ui/BookCard';

const FACULTIES  = ['Law', 'Medicine', 'Engineering', 'Business', 'IT', 'Education', 'Arts', 'Science'];
const LANGUAGES  = ['English', 'Swahili', 'French', 'Arabic', 'Luganda', 'Kinyarwanda', 'Somali', 'Amharic'];
const FORMATS    = ['epub', 'pdf', 'html', 'external'];
const CATEGORIES = ['Textbook', 'Research', 'Fiction', 'Reference', 'Periodical', 'Thesis', 'General'];

// ── Skeleton grid ─────────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] bg-gray-200 rounded-card" />
          <div className="mt-2 h-3 bg-gray-200 rounded w-4/5" />
          <div className="mt-1 h-2 bg-gray-200 rounded w-3/5" />
        </div>
      ))}
    </div>
  );
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, active, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        'text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0',
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:text-primary',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

export default function SearchPage() {
  const [params, setParams]   = useSearchParams();
  const [input,  setInput]    = useState(params.get('q') || '');
  const [faculty,  setFaculty]  = useState(params.get('faculty')   || '');
  const [language, setLanguage] = useState(params.get('language')  || '');
  const [format,   setFormat]   = useState(params.get('format')    || '');
  const [category, setCategory] = useState(params.get('category')  || '');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const {
    searchResults, externalResults, searchLoading, pagination,
    searchBooks, fetchBooks, books, isLoading,
  } = useBookStore();

  const activeQ = params.get('q') || '';

  // Initial load or URL-param-driven search
  useEffect(() => {
    const q        = params.get('q')        || '';
    const fFaculty = params.get('faculty')  || '';
    const fLang    = params.get('language') || '';
    const fCat     = params.get('category') || '';
    const sort     = params.get('sort')     || '';

    setInput(q);
    setFaculty(fFaculty);
    setLanguage(fLang);
    setCategory(fCat);

    if (q) {
      searchBooks(q, { faculty: fFaculty, language: fLang, category: fCat });
    } else {
      fetchBooks({ sort, faculty: fFaculty, language: fLang, category: fCat, limit: 24 });
    }
  }, [params]);

  // Debounced input → update URL after 400ms
  const handleInputChange = useCallback((val) => {
    setInput(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => {
      const p = new URLSearchParams(params);
      if (val.trim()) p.set('q', val.trim());
      else             p.delete('q');
      setParams(p, { replace: true });
    }, 400);
    setDebounceTimer(t);
  }, [debounceTimer, params, setParams]);

  const toggleFilter = (key, value, setter, current) => {
    const next = current === value ? '' : value;
    setter(next);
    const p = new URLSearchParams(params);
    if (next) p.set(key, next);
    else      p.delete(key);
    setParams(p, { replace: true });
  };

  const clearSearch = () => {
    setInput('');
    const p = new URLSearchParams(params);
    p.delete('q');
    setParams(p, { replace: true });
  };

  const isSearchMode = !!activeQ;
  const mainResults  = isSearchMode ? searchResults : books;
  const loading      = isSearchMode ? searchLoading : isLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div className="relative mb-4">
        <FiSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search books, authors, topics…"
          className="w-full pl-10 pr-10 py-3 text-sm border border-gray-300 rounded-card outline-none
                     focus:border-primary focus:ring-1 focus:ring-primary/30 bg-white"
        />
        {input && (
          <button onClick={clearSearch} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <FiX size={16} />
          </button>
        )}
      </div>

      {/* ── Filter chips ─────────────────────────────────────────────────── */}
      <div className="space-y-2 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs text-gray-500 self-center shrink-0">Faculty:</span>
          {FACULTIES.map((f) => (
            <FilterChip key={f} label={f} active={faculty === f}
              onToggle={() => toggleFilter('faculty', f, setFaculty, faculty)} />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs text-gray-500 self-center shrink-0">Language:</span>
          {LANGUAGES.map((l) => (
            <FilterChip key={l} label={l} active={language === l}
              onToggle={() => toggleFilter('language', l, setLanguage, language)} />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <span className="text-xs text-gray-500 self-center shrink-0">Format:</span>
          {FORMATS.map((f) => (
            <FilterChip key={f} label={f.toUpperCase()} active={format === f}
              onToggle={() => toggleFilter('format', f, setFormat, format)} />
          ))}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonGrid />
      ) : !mainResults.length && !externalResults.length ? (
        <div className="text-center py-20">
          <MdSearchOff size={56} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {activeQ ? `No results for "${activeQ}"` : 'No books found'}
          </p>
          <p className="text-sm text-gray-400 mt-1">Try different keywords or remove some filters</p>
        </div>
      ) : (
        <>
          {mainResults.length > 0 && (
            <>
              {isSearchMode && (
                <p className="text-sm text-gray-500 mb-4">
                  {pagination.total} result{pagination.total !== 1 ? 's' : ''} from IUEA catalogue
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mainResults.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>

              {/* Pagination (browse mode) */}
              {!isSearchMode && pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <button
                    onClick={() => {
                      const p = new URLSearchParams(params);
                      p.set('page', Math.max(1, (pagination.page ?? 1) - 1));
                      setParams(p);
                    }}
                    disabled={pagination.page <= 1}
                    className="px-4 py-2 rounded-btn border text-sm disabled:opacity-40 hover:bg-surface"
                  >
                    ← Prev
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => {
                      const p = new URLSearchParams(params);
                      p.set('page', Math.min(pagination.pages, (pagination.page ?? 1) + 1));
                      setParams(p);
                    }}
                    disabled={pagination.page >= pagination.pages}
                    className="px-4 py-2 rounded-btn border text-sm disabled:opacity-40 hover:bg-surface"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

          {/* ── External results (Archive + Gutenberg) ─────────────────── */}
          {isSearchMode && externalResults.length > 0 && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 shrink-0">Also found on Internet Archive & Project Gutenberg</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {externalResults.map((book, i) => (
                  <BookCard key={`ext-${book.archiveId ?? book.gutenbergId ?? i}`} book={book} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
