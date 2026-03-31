import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import {
  ArrowLeft, Settings, MessageCircle, Volume2, VolumeX,
  ZoomIn, ZoomOut, Sun, Moon, BookOpen,
} from 'lucide-react';
import { useBook }          from '../../hooks/useBooks';
import useReaderStore       from '../../store/readerStore';
import { saveProgress, getProgress } from '../../services/progress.service';
import LoadingSpinner       from '../../components/ui/LoadingSpinner';
import ChatPanel            from '../../components/reader/ChatPanel';
import toast                from 'react-hot-toast';

export default function ReaderPage() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const iframeRef    = useRef(null);

  const { data, isLoading } = useBook(id);
  const {
    theme, fontSize, isChatOpen, isTtsPlaying,
    setBook, setTheme, setFontSize, setPage, toggleChat, setTtsPlaying,
  } = useReaderStore();

  const [showSettings, setShowSettings] = useState(false);
  const utteranceRef = useRef(null);

  useEffect(() => {
    if (data?.book) {
      setBook(data.book);
      // Load saved progress
      getProgress(id)
        .then(({ progress }) => {
          if (progress) setPage(progress.currentPage, progress.totalPages);
        })
        .catch(() => {});
    }
  }, [data, id]);

  // Auto-save progress every 30s
  useEffect(() => {
    const { currentPage, totalPages, currentCfi, percentage } = useReaderStore.getState();
    const interval = setInterval(() => {
      if (id && currentPage > 0) {
        saveProgress(id, { currentPage, totalPages, currentCfi, percentage }).catch(() => {});
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [id]);

  const handleTts = () => {
    if (isTtsPlaying) {
      window.speechSynthesis.cancel();
      setTtsPlaying(false);
      return;
    }
    // Try to get selected text or use book description
    const selected = window.getSelection()?.toString();
    const text     = selected || data?.book?.description || 'No text selected.';
    const utter    = new SpeechSynthesisUtterance(text);
    utter.onend    = () => setTtsPlaying(false);
    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
    setTtsPlaying(true);
  };

  const themes = [
    { key: 'light', icon: Sun,  label: 'Light' },
    { key: 'sepia', icon: BookOpen, label: 'Sepia' },
    { key: 'dark',  icon: Moon, label: 'Dark'  },
  ];

  const themeStyles = {
    light: { background: '#FFFFFF', color: '#1A1A1A' },
    sepia: { background: '#F4E4C1', color: '#3D2B1F' },
    dark:  { background: '#1A1A2E', color: '#E0E0E0' },
  };

  if (isLoading) return <LoadingSpinner className="min-h-screen" />;
  if (!data?.book?.fileUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <BookOpen size={48} className="text-gray-300" />
        <p className="text-gray-500">Book file not available.</p>
        <button onClick={() => navigate(-1)} className="text-primary underline text-sm">Go back</button>
      </div>
    );
  }

  const { book } = data;
  const currentTheme = themeStyles[theme] || themeStyles.light;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: currentTheme.background, color: currentTheme.color }}>
      {/* Toolbar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200/30 bg-inherit">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 hover:bg-black/5 rounded-btn">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="font-semibold text-sm line-clamp-1">{book.title}</p>
            <p className="text-xs opacity-60">
              {Array.isArray(book.author) ? book.author[0] : book.author}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={handleTts}     title="Text to speech" className="p-2 hover:bg-black/5 rounded-btn">
            {isTtsPlaying ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button onClick={toggleChat}    title="AI Assistant" className="p-2 hover:bg-black/5 rounded-btn">
            <MessageCircle size={16} className={isChatOpen ? 'text-primary' : ''} />
          </button>
          <button onClick={() => setShowSettings((v) => !v)} title="Settings" className="p-2 hover:bg-black/5 rounded-btn">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-14 right-4 z-40 bg-white text-gray-800 rounded-card shadow-card p-4 w-56 border">
          <p className="text-xs font-semibold text-gray-500 mb-2">FONT SIZE</p>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1 hover:bg-surface rounded"><ZoomOut size={16} /></button>
            <span className="text-sm flex-1 text-center">{fontSize}px</span>
            <button onClick={() => setFontSize(Math.min(28, fontSize + 2))} className="p-1 hover:bg-surface rounded"><ZoomIn size={16} /></button>
          </div>
          <p className="text-xs font-semibold text-gray-500 mb-2">THEME</p>
          <div className="flex gap-2">
            {themes.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex-1 py-1.5 text-xs rounded-btn border transition-colors ${
                  theme === key ? 'border-primary text-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reader + Chat */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto">
          {book.fileType === 'pdf' || book.fileType === 'epub' ? (
            <iframe
              ref={iframeRef}
              src={book.fileUrl}
              title={book.title}
              className="w-full h-full border-0"
              style={{ minHeight: 'calc(100vh - 52px)', fontSize: `${fontSize}px` }}
            />
          ) : (
            <div
              className="max-w-2xl mx-auto px-6 py-10 reader-content"
              style={{ fontSize: `${fontSize}px`, ...currentTheme }}
            >
              <p className="whitespace-pre-wrap">{book.description}</p>
            </div>
          )}
        </main>

        {isChatOpen && (
          <aside className="w-80 border-l flex flex-col bg-white text-gray-800 shrink-0">
            <ChatPanel bookId={id} bookTitle={book.title} />
          </aside>
        )}
      </div>
    </div>
  );
}
