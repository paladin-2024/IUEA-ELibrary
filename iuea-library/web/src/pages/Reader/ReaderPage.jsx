import { useEffect, useRef }                from 'react';
import { useParams, useSearchParams }       from 'react-router-dom';
import useBookStore                         from '../../store/bookStore';
import useReaderStore                       from '../../store/readerStore';
import BookReader                           from '../../components/reader/BookReader';
import AudioPlayer                          from '../../components/reader/AudioPlayer';
import ReaderToolbar                        from '../../components/reader/ReaderToolbar';
import TableOfContents                      from '../../components/reader/TableOfContents';
import LanguageSwitcher                     from '../../components/reader/LanguageSwitcher';

export default function ReaderPage() {
  const { id }           = useParams();
  const [searchParams]   = useSearchParams();
  const mode             = searchParams.get('mode') ?? 'read'; // 'read' | 'audio'
  const autoSaveRef      = useRef(null);

  const { fetchBookById, isLoading, currentBook } = useBookStore();
  const {
    loadProgress, saveProgress,
    setCurrentBook, setReadingMode,
    showTOC, showChatbot, showLanguageSwitcher,
  } = useReaderStore();

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBookById(id);
    loadProgress(id);
  }, [id]);

  useEffect(() => {
    if (currentBook) setCurrentBook(currentBook);
  }, [currentBook]);

  useEffect(() => {
    setReadingMode(mode);
  }, [mode]);

  // ── Auto-save every 30 s ──────────────────────────────────────────────────
  useEffect(() => {
    autoSaveRef.current = setInterval(() => saveProgress(id), 30_000);
    return () => {
      clearInterval(autoSaveRef.current);
      saveProgress(id); // final save on unmount
    };
  }, [id]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading && !currentBook) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="loading-spinner" />
      </div>
    );
  }

  if (!currentBook) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
        <p className="text-gray-500 text-sm">Book not found.</p>
      </div>
    );
  }

  if (!currentBook.fileUrl && !currentBook.archiveId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-white">
        <p className="text-gray-500 text-sm">No readable file available for this book.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Main reading area — fills viewport minus toolbar */}
      <div className="flex-1 pb-16">
        {mode === 'audio'
          ? <AudioPlayer bookId={id} />
          : <BookReader  bookId={id} />
        }
      </div>

      {/* Bottom toolbar — always visible */}
      <ReaderToolbar bookId={id} />

      {/* Overlay: Table of contents */}
      {showTOC && <TableOfContents bookId={id} />}

      {/* Overlay: Language switcher */}
      {showLanguageSwitcher && <LanguageSwitcher bookId={id} />}
    </div>
  );
}
