import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MdAutoStories, MdTranslate }   from 'react-icons/md';
import { BsPlayCircleFill }              from 'react-icons/bs';
import { FiBookmark, FiShare2, FiArrowLeft, FiUser } from 'react-icons/fi';
import { HiOutlineCheckCircle }          from 'react-icons/hi';
import { FiAlertCircle }                 from 'react-icons/fi';
import { MdMenuBook }                    from 'react-icons/md';
import useBookStore  from '../../store/bookStore';
import useAuthStore  from '../../store/authStore';
import BookCard      from '../../components/ui/BookCard';
import api           from '../../services/api';

export default function BookDetailPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuthStore();
  const { currentBook, isLoading, fetchBookById } = useBookStore();

  const [tab,     setTab]     = useState('about');
  const [similar, setSimilar] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    fetchBookById(id);
    api.get(`/books/${id}/similar`)
      .then(({ data }) => setSimilar(data.books ?? []))
      .catch(() => {});
  }, [id]);

  if (isLoading || !currentBook) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-48 h-72 bg-gray-200 rounded-card shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-7 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-200 rounded mt-4" />
          </div>
        </div>
      </div>
    );
  }

  const book         = currentBook;
  const availability = book.availability ?? null;
  const isAvailable  = availability && availability.available > 0;
  const hasFile      = book.fileUrl || book.archiveId || book.gutenbergId;
  const descWords    = (book.description ?? '').split(' ');
  const isLong       = descWords.length > 60;
  const descShort    = isLong && !expanded ? descWords.slice(0, 60).join(' ') + '…' : book.description;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ── Back ─────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6"
      >
        <FiArrowLeft size={15} /> Back
      </button>

      {/* ── Cover + Info ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-card shadow-card p-6 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <div className="shrink-0 w-44 self-start mx-auto md:mx-0">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full rounded-card shadow-md" />
          ) : (
            <div className="w-44 h-64 bg-primary/10 rounded-card flex items-center justify-center">
              <MdMenuBook size={48} className="text-primary/30" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-gray-800 leading-tight flex-1">
              {book.title}
            </h1>
            <button
              onClick={() => navigator.share?.({ title: book.title, url: window.location.href })}
              className="text-gray-400 hover:text-primary shrink-0"
              title="Share"
            >
              <FiShare2 size={18} />
            </button>
          </div>

          {/* Author */}
          <p className="flex items-center gap-1.5 text-primary font-medium mt-1">
            <FiUser size={13} className="shrink-0" />
            {Array.isArray(book.author) ? book.author.join(', ') : book.author}
          </p>

          {/* Availability badge */}
          {availability !== null && (
            <div className={`inline-flex items-center gap-1.5 mt-2 text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-amber-500'}`}>
              {isAvailable
                ? <HiOutlineCheckCircle size={15} />
                : <FiAlertCircle size={15} />}
              {isAvailable
                ? `${availability.available} of ${availability.total} available`
                : `Checked out (${availability.total} cop${availability.total !== 1 ? 'ies' : 'y'})`}
            </div>
          )}

          {/* Language + translate icon */}
          {book.languages?.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-3">
              <MdTranslate size={14} className="text-gray-400 shrink-0" />
              {book.languages.map((l) => (
                <span key={l} className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{l}</span>
              ))}
            </div>
          )}

          {/* Faculty tags */}
          {book.faculty?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {book.faculty.map((f) => (
                <span key={f} className="text-xs border border-accent text-accent px-2 py-0.5 rounded-full">{f}</span>
              ))}
            </div>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
            {book.publishedYear && <span>{book.publishedYear}</span>}
            {book.pageCount  > 0 && <span>{book.pageCount} pages</span>}
            {book.isbn        && <span>ISBN {book.isbn}</span>}
          </div>

          {/* Source attribution */}
          <p className="text-[11px] text-gray-400 mt-1">Source: IUEA Koha Catalogue</p>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-5">
            <button
              disabled={!hasFile}
              onClick={() => navigate(`/reader/${book._id}`)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-btn text-sm
                         font-semibold hover:bg-[#4A0810] transition-colors disabled:opacity-40"
            >
              <MdAutoStories size={16} /> Read Now
            </button>

            <button
              disabled={!hasFile}
              onClick={() => navigate(`/reader/${book._id}?mode=audio`)}
              className="flex items-center gap-2 border border-primary text-primary px-5 py-2.5 rounded-btn
                         text-sm font-semibold hover:bg-primary/5 transition-colors disabled:opacity-40"
            >
              <BsPlayCircleFill size={15} /> Listen
            </button>

            <button
              onClick={() => {
                api.put(`/progress/${book.id ?? book._id}`, { isSaved: !saved }).catch(() => {});
                setSaved(v => !v);
              }}
              className="p-2.5 border border-gray-300 rounded-btn transition-colors"
              style={{ color: saved ? '#5C0F1F' : undefined, borderColor: saved ? '#5C0F1F' : undefined }}
              title={saved ? 'Remove from saved' : 'Save book'}
            >
              <FiBookmark size={16} fill={saved ? '#5C0F1F' : 'none'} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mt-6 border-b border-gray-200">
        {['about', 'similar'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'px-5 py-2.5 text-sm font-medium capitalize transition-colors',
              tab === t
                ? 'border-b-2 border-primary text-primary -mb-px'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {t === 'similar' ? 'Similar Books' : 'About'}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'about' ? (
          <div className="bg-white rounded-card shadow-card p-6">
            {book.description ? (
              <>
                <p className="text-gray-600 text-sm leading-relaxed">{descShort}</p>
                {isLong && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="text-primary text-xs mt-2 hover:underline"
                  >
                    {expanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm italic">No description available.</p>
            )}
          </div>
        ) : (
          <div>
            {similar.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {similar.map((b) => <BookCard key={b._id} book={b} />)}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No similar books found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
