import { useState, useEffect } from 'react';
import { useSearchParams }     from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useSearchBooks, useBooks }  from '../../hooks/useBooks';
import BookCard       from '../../components/ui/BookCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState     from '../../components/ui/EmptyState';
import Input          from '../../components/ui/Input';
import { CATEGORIES, LANGUAGES } from '../../utils/constants';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [query,    setQuery]    = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || '');
  const [language, setLanguage] = useState(params.get('language') || '');
  const [page,     setPage]     = useState(1);

  const activeQ = params.get('q') || '';

  const { data: searchData, isLoading: searching } = useSearchBooks(activeQ, { category, language, page });
  const { data: browseData, isLoading: browsing   } = useBooks({ category, language, page, limit: 20 });

  const data      = activeQ ? searchData : browseData;
  const isLoading = activeQ ? searching  : browsing;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    const p = new URLSearchParams();
    if (query)    p.set('q', query);
    if (category) p.set('category', category);
    if (language) p.set('language', language);
    setParams(p);
  };

  useEffect(() => {
    setQuery(params.get('q') || '');
    setCategory(params.get('category') || '');
  }, [params]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-semibold text-primary mb-6">
        {activeQ ? `Results for "${activeQ}"` : 'Browse Books'}
      </h1>

      {/* Search + Filters */}
      <form onSubmit={handleSearch} className="bg-white rounded-card shadow-card p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <Input
            label="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, author, keyword…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); setPage(1); }}
            className="rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary"
          >
            <option value="">All languages</option>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-primary text-white px-5 py-2.5 rounded-btn text-sm font-medium hover:bg-primary-dark flex items-center gap-2">
          <Search size={14} /> Search
        </button>
      </form>

      {/* Results */}
      {isLoading ? (
        <LoadingSpinner className="py-20" />
      ) : !data?.books?.length ? (
        <EmptyState title="No books found" message="Try different keywords or filters." />
      ) : (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.total} book{data.total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {data.books.map((book) => <BookCard key={book._id} book={book} />)}
          </div>

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-btn border text-sm disabled:opacity-40 hover:bg-surface">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="px-4 py-2 rounded-btn border text-sm disabled:opacity-40 hover:bg-surface">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
