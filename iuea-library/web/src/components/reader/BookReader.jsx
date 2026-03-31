import { useRef, useState, useEffect, useCallback } from 'react';
import { ReactReader }   from 'react-reader';
import useReaderStore, { READER_THEMES } from '../../store/readerStore';
import ReaderToolbar     from './ReaderToolbar';
import TableOfContents   from './TableOfContents';
import LanguageSwitcher  from './LanguageSwitcher';

// Build CSS string injected into the epub iframe
function buildEpubCss({ fontSize, lineHeight, fontFamily, theme }) {
  const t = READER_THEMES[theme] || READER_THEMES.light;
  return `
    body, p, span, div {
      font-size: ${fontSize}px !important;
      line-height: ${lineHeight} !important;
      font-family: ${fontFamily === 'serif' ? 'Georgia, serif' : fontFamily === 'mono' ? 'monospace' : 'system-ui, sans-serif'} !important;
      color: ${t.color} !important;
      background: ${t.background} !important;
    }
  `;
}

export default function BookReader({ bookId }) {
  const renditionRef   = useRef(null);
  const [toc,  setToc] = useState([]);

  const {
    currentBook, currentCfi, fontSize, lineHeight, fontFamily, theme,
    showTOC, showLanguageSwitcher, showFontPanel, showToolbar,
    setCfi, setChapter, setPage, percentComplete,
    toggleToolbar, toggleFontPanel,
    saveProgress, translatedContent,
  } = useReaderStore();

  const themeStyles = READER_THEMES[theme] || READER_THEMES.light;

  // Inject CSS whenever display settings change
  useEffect(() => {
    if (!renditionRef.current) return;
    renditionRef.current.themes.default(buildEpubCss({ fontSize, lineHeight, fontFamily, theme }));
  }, [fontSize, lineHeight, fontFamily, theme]);

  // Auto-save every 30 s
  useEffect(() => {
    const id = setInterval(() => saveProgress(bookId), 30_000);
    return () => { clearInterval(id); saveProgress(bookId); };
  }, [bookId]);

  const handleLocationChanged = useCallback((epubcfi) => {
    setCfi(epubcfi);
    // Extract chapter title from rendition
    if (renditionRef.current) {
      try {
        const loc = renditionRef.current.currentLocation();
        if (loc?.start?.href) {
          const item = renditionRef.current.book.navigation?.toc?.find(
            (t) => loc.start.href.includes(t.href)
          );
          if (item) setChapter(item.label?.trim() || '', null);
        }
        if (loc?.start?.percentage != null) {
          const pct = Math.round(loc.start.percentage * 100);
          setPage(pct, 100);
        }
      } catch (_) {}
    }
  }, [setCfi, setChapter, setPage]);

  const handleGetRendition = useCallback((rendition) => {
    renditionRef.current = rendition;
    rendition.themes.default(buildEpubCss({ fontSize, lineHeight, fontFamily, theme }));
  }, [fontSize, lineHeight, fontFamily, theme]);

  if (!currentBook) return null;

  const fileUrl = currentBook.fileUrl || '';

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: themeStyles.background }}
      onClick={() => toggleToolbar()}
    >
      {/* Click trap so toolbar toggles don't propagate into reader */}
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col flex-1">

        {/* TOC slide-in */}
        {showTOC && (
          <div onClick={(e) => e.stopPropagation()}>
            <TableOfContents toc={toc} currentCfi={currentCfi} />
          </div>
        )}

        {/* Language switcher modal */}
        {showLanguageSwitcher && (
          <div onClick={(e) => e.stopPropagation()}>
            <LanguageSwitcher bookId={bookId} />
          </div>
        )}

        {/* Font panel */}
        {showFontPanel && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-0 right-0 bottom-0 z-40 w-64 shadow-xl p-5 flex flex-col gap-4"
            style={{ background: themeStyles.background, color: themeStyles.color, borderLeft: `1px solid ${themeStyles.borderColor}` }}
          >
            <p className="font-semibold text-sm uppercase tracking-wide opacity-60">Font Size</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => useReaderStore.getState().setFontSize(fontSize - 2)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-lg font-bold"
                style={{ borderColor: themeStyles.borderColor }}
              >−</button>
              <span className="flex-1 text-center text-sm">{fontSize}px</span>
              <button
                onClick={() => useReaderStore.getState().setFontSize(fontSize + 2)}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-lg font-bold"
                style={{ borderColor: themeStyles.borderColor }}
              >+</button>
            </div>
            <p className="font-semibold text-sm uppercase tracking-wide opacity-60 mt-2">Theme</p>
            <div className="flex gap-2">
              {Object.keys(READER_THEMES).map((t) => (
                <button
                  key={t}
                  onClick={() => useReaderStore.getState().setTheme(t)}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-colors capitalize ${
                    theme === t ? 'border-primary text-primary bg-primary/5' : ''
                  }`}
                  style={{ borderColor: theme === t ? '#7B0D1E' : themeStyles.borderColor }}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="font-semibold text-sm uppercase tracking-wide opacity-60 mt-2">Font</p>
            <div className="flex flex-col gap-2">
              {['serif', 'sans', 'mono'].map((f) => (
                <button
                  key={f}
                  onClick={() => useReaderStore.getState().setFontFamily(f)}
                  className={`py-2 px-3 text-sm rounded-lg border text-left capitalize ${
                    fontFamily === f ? 'border-primary text-primary' : ''
                  }`}
                  style={{ borderColor: fontFamily === f ? '#7B0D1E' : themeStyles.borderColor }}
                >
                  {f === 'serif' ? 'Serif (Georgia)' : f === 'sans' ? 'Sans-serif' : 'Monospace'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EPUB reader */}
        <div className="flex-1" style={{ height: showToolbar ? 'calc(100vh - 64px)' : '100vh' }}>
          <ReactReader
            url={fileUrl}
            location={currentCfi || undefined}
            locationChanged={handleLocationChanged}
            getRendition={handleGetRendition}
            tocChanged={setToc}
            readerStyles={{
              ...defaultStyles,
              readerArea: {
                ...defaultStyles.readerArea,
                background: themeStyles.background,
              },
            }}
          />
        </div>

        {/* Translated content overlay */}
        {translatedContent && (
          <div
            className="fixed inset-0 z-30 overflow-y-auto p-6 pt-16 pb-20"
            style={{ background: themeStyles.background, color: themeStyles.color }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="max-w-2xl mx-auto prose"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              <p className="whitespace-pre-wrap">{translatedContent}</p>
            </div>
          </div>
        )}

        {/* Bottom toolbar */}
        {showToolbar && (
          <div onClick={(e) => e.stopPropagation()}>
            <ReaderToolbar bookId={bookId} percentComplete={percentComplete} />
          </div>
        )}
      </div>
    </div>
  );
}

// Minimal react-reader default styles override
const defaultStyles = {
  container:  { position: 'relative', height: '100%' },
  readerArea: { position: 'relative', zIndex: 1, height: '100%', width: '100%', backgroundColor: '#fff' },
  swipeWrapper: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, zIndex: 200 },
  prev:       { left: 1 },
  next:       { right: 1 },
  arrow:      { outline: 'none', border: 'none', background: 'none', color: '#aaa', cursor: 'pointer', fontSize: 28, padding: '0 10px', userSelect: 'none' },
  arrowHover: { color: '#7B0D1E' },
  reader:     { position: 'absolute', top: 0, left: 50, bottom: 0, right: 50 },
  titleArea:  { display: 'none' },
  tocArea:    { display: 'none' },
};
