import { useEffect, useState }         from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiFilter }        from 'react-icons/fi';
import api                              from '../../services/api';
import BookCard                         from '../../components/ui/BookCard';
import SkeletonCard                     from '../../components/ui/SkeletonCard';
import EmptyState                       from '../../components/ui/EmptyState';
import Dropdown                         from '../../components/ui/Dropdown';

const SORT_OPTIONS = [
  { value: 'newest',  label: 'Newest first'  },
  { value: 'popular', label: 'Most popular'  },
  { value: 'title',   label: 'A – Z'         },
];

export default function FacultyBrowsePage() {
  const { faculty }  = useParams();       // route: /faculty/:faculty
  const navigate     = useNavigate();
  const label        = faculty ? decodeURIComponent(faculty) : '';

  const [books,    setBooks]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [sort,     setSort]    = useState('newest');
  const [page,     setPage]    = useState(1);
  const [pages,    setPages]   = useState(1);

  useEffect(() => {
    if (!faculty) return;
    setLoading(true);
    api.get('/books', { params: { faculty: label, sort, page, limit: 20 } })
      .then(({ data }) => {
        setBooks(data.books ?? []);
        setPages(data.pages ?? 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [faculty, sort, page]);

  // Reset page when sort changes
  const handleSort = (v) => { setSort(v); setPage(1); };

  return (
    <div className="px-6 py-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <FiArrowLeft size={15} /> Back
      </button>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Faculty</p>
          <h1 className="text-2xl font-bold text-gray-900">{label || '…'}</h1>
        </div>

        <div className="flex items-center gap-2">
          <FiFilter size={14} className="text-gray-400" />
          <Dropdown
            options={SORT_OPTIONS}
            value={sort}
            onChange={handleSort}
            className="w-44"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          title="No books found"
          description={`No books are listed under the "${label}" faculty yet.`}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {books.map((book) => (
              <BookCard key={book._id} book={book} size="grid" />
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-btn disabled:opacity-40 hover:border-primary transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">{page} / {pages}</span>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-btn disabled:opacity-40 hover:border-primary transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
