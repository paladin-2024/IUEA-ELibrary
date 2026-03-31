import { useQuery }    from '@tanstack/react-query';
import { Link }        from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import { getAllProgress }  from '../../services/progress.service';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState     from '../../components/ui/EmptyState';

export default function LibraryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['progress', 'all'],
    queryFn:  getAllProgress,
  });

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;

  const progresses = data?.progresses || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-serif text-2xl font-semibold text-primary mb-6">My Library</h1>

      {progresses.length === 0 ? (
        <EmptyState
          title="No books yet"
          message="Start reading a book and it will appear here."
          icon={BookOpen}
        />
      ) : (
        <div className="space-y-3">
          {progresses.map(({ book, currentPage, totalPages, percentage, lastReadAt, isCompleted }) => (
            <Link
              key={book._id}
              to={`/reader/${book._id}`}
              className="flex items-center gap-4 bg-white rounded-card shadow-card p-4 hover:shadow-btn transition-shadow"
            >
              {/* Cover */}
              <div className="w-12 h-16 shrink-0 bg-primary/10 rounded overflow-hidden">
                {book.coverUrl ? (
                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={20} className="text-primary/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 line-clamp-1">{book.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {Array.isArray(book.author) ? book.author.join(', ') : book.author}
                </p>
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>{isCompleted ? '✓ Completed' : `${percentage}% read`}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(lastReadAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              <span className="text-xs text-primary font-medium shrink-0">Continue →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
