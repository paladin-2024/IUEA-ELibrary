import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function BookCard({ book, className = '' }) {
  return (
    <Link
      to={`/books/${book._id}`}
      className={`group block bg-white rounded-card shadow-card hover:shadow-btn transition-shadow overflow-hidden ${className}`}
    >
      {/* Cover */}
      <div className="aspect-[2/3] bg-surface overflow-hidden">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <BookOpen size={40} className="text-primary/40" />
          </div>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight">{book.title}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
          {Array.isArray(book.author) ? book.author.join(', ') : book.author}
        </p>
        {book.category && (
          <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {book.category}
          </span>
        )}
      </div>
    </Link>
  );
}
