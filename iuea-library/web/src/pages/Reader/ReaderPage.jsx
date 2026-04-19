import { useEffect, useRef, useState }        from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import useBookStore                              from '../../store/bookStore';
import useReaderStore                            from '../../store/readerStore';
import BookReader                                from '../../components/reader/BookReader';
import AudioPlayer                               from '../../components/reader/AudioPlayer';
import ReaderToolbar                             from '../../components/reader/ReaderToolbar';
import TableOfContents                           from '../../components/reader/TableOfContents';
import LanguageSwitcher                          from '../../components/reader/LanguageSwitcher';
import ChatbotOverlay                            from '../../components/chatbot/ChatbotOverlay';

/* ─────────────────────────────────────────────────────────────────────────────
   Theme palette map
   ───────────────────────────────────────────────────────────────────────────── */
const THEME_STYLES = {
  white: { bg: '#ffffff', text: '#1a0609', panel: '#f9f4f4', border: 'rgba(223,191,190,0.4)' },
  sepia: { bg: '#f8f0e0', text: '#3d2005', panel: '#f0e4c8', border: 'rgba(193,152,85,0.4)'  },
  dark:  { bg: '#141010', text: '#e8d8d9', panel: '#1e1618', border: 'rgba(80,40,45,0.5)'    },
};

/* ─────────────────────────────────────────────────────────────────────────────
   ReaderPage
   ───────────────────────────────────────────────────────────────────────────── */
export default function ReaderPage() {
  const { id }         = useParams();
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const mode           = searchParams.get('mode') ?? 'read';
  const autoSaveRef    = useRef(null);

  const { fetchBookById, isLoading, currentBook } = useBookStore();
  const {
    loadProgress, saveProgress,
    setCurrentBook, setReadingMode,
    showTOC, showChatbot, showLanguageSwitcher,
    toggleChatbot, toggleTOC,
    theme, percentComplete,
  } = useReaderStore();

  const t = THEME_STYLES[theme] ?? THEME_STYLES.white;

  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchBookById(id);
    loadProgress(id);
  }, [id]);

  useEffect(() => { if (currentBook) setCurrentBook(currentBook); }, [currentBook]);
  useEffect(() => { setReadingMode(mode); }, [mode]);

  // ── Auto-save ────────────────────────────────────────────────────────────
  useEffect(() => {
    autoSaveRef.current = setInterval(() => saveProgress(id), 30_000);
    return () => { clearInterval(autoSaveRef.current); saveProgress(id); };
  }, [id]);

  // ── Loading / error screens ───────────────────────────────────────────────
  if (isLoading && !currentBook) return <LoadingScreen />;

  if (!currentBook) return (
    <ErrorScreen message="Book not found." onBack={() => navigate(-1)} />
  );

  if (!currentBook.fileUrl && !currentBook.archiveId) return (
    <ErrorScreen message="No readable file available for this book." onBack={() => navigate(-1)} />
  );

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      background: t.bg, color: t.text,
      transition: 'background 0.3s ease, color 0.3s ease',
      overflow: 'hidden',
    }}>
      {/* ── Thin top progress bar ─────────────────────────────────────────── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, height: 3, background: 'rgba(0,0,0,0.08)' }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, percentComplete)}%`,
          background: 'linear-gradient(90deg, #5C0F1F, #B8964A)',
          transition: 'width 0.6s ease',
          boxShadow: '0 0 8px rgba(107,15,26,0.4)',
        }} />
      </div>

      {/* ── Top header ───────────────────────────────────────────────────── */}
      <TopHeader
        book={currentBook}
        progress={percentComplete}
        theme={t}
        onBack={() => { saveProgress(id); navigate(-1); }}
        onTOC={toggleTOC}
        sidebarOpen={showTOC}
      />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', paddingTop: 64, paddingBottom: 80 }}>

        {/* Reading content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          minWidth: 0,
        }}>
          {mode === 'audio'
            ? <AudioPlayer bookId={id} />
            : <BookReader  bookId={id} />
          }
        </main>
      </div>

      {/* ── Bottom floating toolbar ───────────────────────────────────────── */}
      <ReaderToolbar bookId={id} theme={t} />

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      {showTOC            && <TableOfContents  bookId={id} />}
      {showLanguageSwitcher && <LanguageSwitcher bookId={id} />}
      {showChatbot        && <ChatbotOverlay bookId={id} onClose={toggleChatbot} />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TopHeader
   ───────────────────────────────────────────────────────────────────────────── */
function TopHeader({ book, progress, theme: t, onBack, onTOC, sidebarOpen }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = document.querySelector('main');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 20);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header style={{
      position: 'fixed', top: 3, left: 0, right: 0, zIndex: 50,
      height: 61,
      background: scrolled
        ? (t.bg === '#141010' ? 'rgba(20,16,16,0.96)' : 'rgba(255,255,255,0.96)')
        : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? `1px solid ${t.border}` : '1px solid transparent',
      transition: 'background 0.25s ease, border-color 0.25s ease, backdrop-filter 0.25s ease',
      display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px',
    }}>
      {/* Back */}
      <button onClick={onBack} style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none',
        background: 'rgba(107,15,26,0.1)', color: '#5C0F1F',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
      </button>

      {/* TOC toggle */}
      <button onClick={onTOC} style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none',
        background: sidebarOpen ? '#5C0F1F' : 'rgba(107,15,26,0.08)',
        color: sidebarOpen ? '#fff' : '#5C0F1F',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background 0.2s ease, color 0.2s ease',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>toc</span>
      </button>

      {/* Title area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 14, fontWeight: 700, color: t.text,
          margin: 0, lineHeight: 1.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{book.title}</p>
        {book.author && (
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 11, color: t.text, opacity: 0.55,
            margin: 0, lineHeight: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{book.author}</p>
        )}
      </div>

      {/* Progress badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(107,15,26,0.08)', borderRadius: 20,
        padding: '4px 10px', flexShrink: 0,
      }}>
        <div style={{ width: 36, height: 4, background: 'rgba(0,0,0,0.1)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#5C0F1F', borderRadius: 99 }} />
        </div>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
          color: '#5C0F1F',
        }}>{progress}%</span>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Loading / Error screens
   ───────────────────────────────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#fff', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid #FDF4F2', borderTopColor: '#5C0F1F',
        animation: 'rdr-spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes rdr-spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#A89597' }}>
        Loading book…
      </p>
    </div>
  );
}

function ErrorScreen({ message, onBack }) {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#fff', gap: 16,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#EBD2CF' }}>menu_book</span>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#A89597', margin: 0 }}>{message}</p>
      <button onClick={onBack} style={{
        background: '#5C0F1F', color: '#fff', border: 'none', borderRadius: 10,
        padding: '10px 20px', fontFamily: 'Inter, sans-serif', fontSize: 13,
        fontWeight: 600, cursor: 'pointer',
      }}>Go back</button>
    </div>
  );
}
