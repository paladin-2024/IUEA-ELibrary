import { useParams, Link } from 'react-router-dom';
import { BookOpen, BookMarked, Share2, PlayCircle } from 'lucide-react';
import { useBook, useSimilarBooks } from '../../hooks/useBooks';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import BookCard       from '../../components/ui/BookCard';
import Button         from '../../components/ui/Button';
import useAuthStore   from '../../store/authStore';

export default function BookPage() {
  const { id }   = useParams();
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useBook(id);
  const { data: similarData }        = useSimilarBooks(id);

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (isError)   return <div className="text-center py-20 text-red-500">Failed to load book.</div>;

  const { book } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Book detail */}
      <div className="bg-white rounded-card shadow-card p-6 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <div className="shrink-0 w-48 self-start mx-auto md:mx-0">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full rounded-card shadow-md" />
          ) : (
            <div className="w-48 h-64 bg-primary/10 rounded-card flex items-center justify-center">
              <BookOpen size={48} className="text-primary/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-semibold text-gray-800 leading-tight">{book.title}</h1>
              <p className="text-primary font-medium mt-1">
                {Array.isArray(book.author) ? book.author.join(', ') : book.author}
              </p>
            </div>
            <button className="text-gray-400 hover:text-primary" title="Share">
              <Share2 size={18} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {book.category && (
              <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{book.category}</span>
            )}
            {book.language && (
              <span className="text-xs bg-accent/20 text-primary px-3 py-1 rounded-full uppercase">{book.language}</span>
            )}
            {book.publishedYear && (
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{book.publishedYear}</span>
            )}
          </div>

          {book.description && (
            <p className="mt-4 text-gray-600 text-sm leading-relaxed">{book.description}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 text-sm text-gray-500">
            {book.pageCount > 0 && <div><span className="font-medium text-gray-700">Pages: </span>{book.pageCount}</div>}
            {book.publisher   && <div><span className="font-medium text-gray-700">Publisher: </span>{book.publisher}</div>}
            {book.isbn        && <div><span className="font-medium text-gray-700">ISBN: </span>{book.isbn}</div>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            {user ? (
              <>
                <Link to={`/reader/${book._id}`}>
                  <Button variant="primary" className="flex items-center gap-2">
                    <BookMarked size={16} /> Read Now
                  </Button>
                </Link>
                <Button variant="ghost" className="flex items-center gap-2">
                  <PlayCircle size={16} /> Listen
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button variant="primary">Login to Read</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Similar books */}
      {similarData?.books?.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-primary mb-4">Similar Books</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {similarData.books.map((b) => <BookCard key={b._id} book={b} />)}
          </div>
        </div>
      )}
    </div>
  );
}
