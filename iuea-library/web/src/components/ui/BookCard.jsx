import { useNavigate } from 'react-router-dom';
import { MdMenuBook }          from 'react-icons/md';
import { FiUser, FiAlertCircle } from 'react-icons/fi';
import { HiOutlineCheckCircle }  from 'react-icons/hi';

export default function BookCard({ book, showProgress = false, size = 'md', className = '' }) {
  const navigate = useNavigate();
  const isSmall  = size === 'sm';

  const availability = book.availability ?? null;
  const hasAvail     = availability !== null;
  const isAvailable  = hasAvail && availability.available > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/books/${book._id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/books/${book._id}`)}
      className={`group cursor-pointer bg-white rounded-card shadow-card hover:shadow-btn transition-shadow overflow-hidden ${className}`}
    >
      {/* Cover */}
      <div className={`aspect-[2/3] bg-surface overflow-hidden relative ${isSmall ? 'max-h-36' : ''}`}>
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <MdMenuBook size={isSmall ? 28 : 40} className="text-primary/40" />
          </div>
        )}

        {/* Progress overlay bar */}
        {showProgress && book.progress?.percentComplete > 0 && (
          <div className="absolute bottom-0 inset-x-0 bg-black/30 px-2 py-1">
            <div className="w-full bg-white/30 rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: `${book.progress.percentComplete}%` }}
              />
            </div>
            <p className="text-white text-[10px] mt-0.5 text-right">
              {book.progress.percentComplete}% complete
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <h3 className={`font-semibold text-gray-800 line-clamp-2 leading-tight ${isSmall ? 'text-xs' : 'text-sm'}`}>
          {book.title}
        </h3>

        {book.author && (
          <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 line-clamp-1">
            <FiUser size={10} className="shrink-0" />
            {Array.isArray(book.author) ? book.author.join(', ') : book.author}
          </p>
        )}

        {/* Language badges */}
        {book.languages?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {book.languages.slice(0, 2).map((lang) => (
              <span
                key={lang}
                className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full leading-none"
              >
                {lang}
              </span>
            ))}
            {book.languages.length > 2 && (
              <span className="text-[10px] text-gray-400">+{book.languages.length - 2}</span>
            )}
          </div>
        )}

        {/* Koha availability */}
        {hasAvail && (
          <div className={`flex items-center gap-1 mt-1.5 ${isAvailable ? 'text-green-600' : 'text-amber-500'}`}>
            {isAvailable ? (
              <HiOutlineCheckCircle size={11} />
            ) : (
              <FiAlertCircle size={11} />
            )}
            <span className="text-[10px]">
              {isAvailable
                ? `${availability.available} available`
                : 'Checked out'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
