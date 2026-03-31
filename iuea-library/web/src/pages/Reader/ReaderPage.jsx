import { useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { MdMenuBook } from 'react-icons/md';
import useBookStore   from '../../store/bookStore';
import useReaderStore from '../../store/readerStore';
import BookReader     from '../../components/reader/BookReader';
import AudioPlayer    from '../../components/reader/AudioPlayer';

export default function ReaderPage() {
  const { id }                    = useParams();
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();
  const mode                      = searchParams.get('mode') || 'read';

  const { currentBook, isLoading, fetchBookById } = useBookStore();
  const { setBook, setReadingMode, loadProgress }  = useReaderStore();

  useEffect(() => {
    fetchBookById(id);
  }, [id]);

  useEffect(() => {
    if (currentBook) {
      setBook(currentBook);
      loadProgress(id);
    }
  }, [currentBook, id]);

  useEffect(() => {
    setReadingMode(mode === 'audio' ? 'audio' : 'read');
  }, [mode]);

  if (isLoading && !currentBook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!currentBook) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <MdMenuBook size={48} className="text-gray-300" />
        <p className="text-gray-500 text-sm">Book not found.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button>
      </div>
    );
  }

  if (!currentBook.fileUrl && !currentBook.archiveId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <MdMenuBook size={48} className="text-gray-300" />
        <p className="text-gray-500 text-sm">No readable file available for this book.</p>
        <button onClick={() => navigate(-1)} className="text-sm text-primary underline">Go back</button>
      </div>
    );
  }

  if (mode === 'audio') {
    return <AudioPlayer bookId={id} />;
  }

  return <BookReader bookId={id} />;
}
