import { useEffect, useState }    from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser }    from 'react-icons/fi';
import api                        from '../../services/api';
import BookCard                   from '../../components/ui/BookCard';
import SkeletonCard               from '../../components/ui/SkeletonCard';
import EmptyState                 from '../../components/ui/EmptyState';

export default function AuthorPage() {
  const { name }   = useParams();       // route: /authors/:name
  const navigate   = useNavigate();
  const [author,   setAuthor]  = useState(null);
  const [books,    setBooks]   = useState([]);
  const [loading,  setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    setLoading(true);
    api.get('/books', { params: { author: decodeURIComponent(name), limit: 50 } })
      .then(({ data }) => {
        setBooks(data.books ?? []);
        setAuthor(decodeURIComponent(name));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <div className="px-6 py-6 max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <FiArrowLeft size={15} /> Back
      </button>

      {/* Author header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <FiUser size={28} className="text-primary/50" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{author ?? '…'}</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {books.length} {books.length === 1 ? 'book' : 'books'} in the library
            </p>
          )}
        </div>
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          title="No books found"
          description={`We couldn't find any books by "${author}" in the library.`}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book) => (
            <BookCard key={book._id} book={book} size="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
