import { useEffect, useState } from 'react';
import { FiX, FiList }        from 'react-icons/fi';
import { MdCircle }           from 'react-icons/md';
import useReaderStore         from '../../store/readerStore';

// We derive TOC from the epub book object; pass it as a prop from BookReader.
// ReaderPage passes bookId; the toc state lives in parent via readerStore.
export default function TableOfContents() {
  const {
    currentBook, currentCfi, currentChapter, percentComplete,
    setCurrentCfi, toggleTOC,
  } = useReaderStore();

  // TOC is built from epub internally — we expose it via a hidden ReactReader.
  // In practice the parent BookReader already has it; we store it separately.
  const [toc, setToc] = useState([]);

  // Load toc from epub if we don't have it yet
  useEffect(() => {
    if (!currentBook?.fileUrl || toc.length > 0) return;
    // We use epubjs directly to parse TOC without rendering
    import('epubjs').then(({ default: Epub }) => {
      const book = Epub(currentBook.fileUrl);
      book.loaded.navigation.then((nav) => {
        setToc(nav.toc ?? []);
        book.destroy();
      }).catch(() => {});
    }).catch(() => {});
  }, [currentBook, toc.length]);

  const handleChapterClick = (item) => {
    if (item.href) {
      // Generate a CFI for the start of the chapter
      setCurrentCfi(item.href);
    }
    toggleTOC();
  };

  return (
    // ── Backdrop ─────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-50 flex"
      onClick={toggleTOC}
    >
      {/* ── Panel ─────────────────────────────────────────────────────── */}
      <div
        className="w-72 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FiList size={18} className="text-primary" />
            <span className="font-semibold text-gray-800 text-sm">Contents</span>
          </div>
          <button
            onClick={toggleTOC}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Overall progress */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Reading progress</span>
            <span className="font-semibold text-primary">{Math.round(percentComplete)}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Chapter list */}
        <div className="flex-1 overflow-y-auto py-2">
          {toc.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">
              No chapters found.
            </p>
          ) : (
            toc.map((item, idx) => {
              const isCurrent  = idx === currentChapter;
              const isRead     = idx < currentChapter;
              return (
                <button
                  key={item.id ?? idx}
                  onClick={() => handleChapterClick(item)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                    ${isCurrent ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                >
                  {/* Status dot */}
                  <MdCircle
                    size={8}
                    className={
                      isCurrent ? 'text-primary shrink-0' :
                      isRead    ? 'text-[#C9A84C] shrink-0' :
                                  'text-gray-300 shrink-0'
                    }
                  />
                  <span
                    className={`text-sm line-clamp-2 ${
                      isCurrent
                        ? 'font-semibold text-primary'
                        : isRead
                          ? 'text-gray-400 line-through'
                          : 'text-gray-700'
                    }`}
                  >
                    {item.label?.trim() ?? `Chapter ${idx + 1}`}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Dim rest of screen */}
      <div className="flex-1 bg-black/30" />
    </div>
  );
}
