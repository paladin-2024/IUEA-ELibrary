import { useEffect }              from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft }            from 'react-icons/fi';
import useBookStore               from '../../store/bookStore';
import useReaderStore             from '../../store/readerStore';
import AudioPlayer                from '../../components/reader/AudioPlayer';
import PageLayout                 from '../../components/layout/PageLayout';
import SkeletonCard               from '../../components/ui/SkeletonCard';

export default function AudioPlayerPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const { currentBook, isLoading, fetchBookById } = useBookStore();
  const { setCurrentBook, loadProgress }          = useReaderStore();

  useEffect(() => {
    if (id) fetchBookById(id);
  }, [id]);

  // Sync book from bookStore into readerStore so AudioPlayer can access it
  useEffect(() => {
    if (currentBook) {
      setCurrentBook(currentBook);
      loadProgress(id);
    }
  }, [currentBook, id]);

  return (
    <PageLayout>
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <FiArrowLeft size={15} /> Back to book
      </button>

      {isLoading || !currentBook ? (
        <div className="max-w-lg mx-auto">
          <SkeletonCard className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          {/* Book info */}
          <div className="flex items-center gap-4 mb-8">
            {currentBook.coverUrl && (
              <img
                src={currentBook.coverUrl}
                alt={currentBook.title}
                className="w-20 h-28 rounded-xl object-cover shadow-md shrink-0"
              />
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Now listening</p>
              <h1 className="text-xl font-bold text-gray-900 leading-snug">{currentBook.title}</h1>
              {currentBook.author && (
                <p className="text-sm text-gray-500 mt-1">
                  {Array.isArray(currentBook.author)
                    ? currentBook.author.join(', ')
                    : currentBook.author}
                </p>
              )}
            </div>
          </div>

          {/* Player */}
          <AudioPlayer bookId={id} />
        </div>
      )}
    </PageLayout>
  );
}
