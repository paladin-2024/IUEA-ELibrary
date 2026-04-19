import { useRef, useState, useEffect, useCallback } from 'react';
import { ReactReader }   from 'react-reader';
import useReaderStore    from '../../store/readerStore';
import useTextToSpeech   from '../../hooks/useTextToSpeech';

// ── Theme definitions injected into EPUB iframe ───────────────────────────────
const EPUB_THEMES = {
  white: {
    body:  { background: '#FFFFFF !important', color: '#1A0508 !important' },
  },
  sepia: {
    body:  { background: '#F5ECD7 !important', color: '#3B2A1A !important' },
  },
  dark:  {
    body:  { background: '#1A1A2E !important', color: '#E8E8E8 !important' },
  },
};

const THEME_BG = { white: 'bg-white', sepia: 'bg-[#F5ECD7]', dark: 'bg-[#1A1A2E]' };

export default function BookReader({ bookId }) {
  const renditionRef   = useRef(null);
  const [toc, setToc]  = useState([]);

  const {
    currentBook, currentCfi, fontSize, lineHeight, fontFamily, theme,
    translatedContent, currentChapterText, currentWordIndex,
    setCurrentCfi, setChapterText, setCurrentChapter, setPercentComplete,
    addHighlight, highlights,
    showTOC, showLanguageSwitcher,
    toggleToolbar,
  } = useReaderStore();

  const { currentWordIndex: ttsWordIndex } = useTextToSpeech();

  // ── Inject EPUB styles on settings change ────────────────────────────────
  const applyRenditionStyles = useCallback(() => {
    const r = renditionRef.current;
    if (!r) return;

    const fontStack = fontFamily === 'sans'
      ? 'system-ui, -apple-system, sans-serif'
      : fontFamily === 'mono'
        ? 'monospace'
        : 'Georgia, "Times New Roman", serif';

    const themeColors = EPUB_THEMES[theme] ?? EPUB_THEMES.white;

    r.themes.default({
      body: {
        ...themeColors.body,
        'font-size':   `${fontSize}px !important`,
        'line-height': `${lineHeight} !important`,
        'font-family': `${fontStack} !important`,
        padding:       '0 3% !important',
      },
      p: {
        'font-size':   `${fontSize}px !important`,
        'line-height': `${lineHeight} !important`,
      },
    });
  }, [fontSize, lineHeight, fontFamily, theme]);

  useEffect(() => {
    applyRenditionStyles();
  }, [applyRenditionStyles]);

  const handleGetRendition = useCallback((rendition) => {
    renditionRef.current = rendition;
    applyRenditionStyles();

    // Extract plain text when chapter renders — used by TTS + translation
    rendition.hooks.content.register((contents) => {
      const text = contents.document.body?.innerText ?? '';
      if (text.trim()) setChapterText(text.trim());
    });
  }, [applyRenditionStyles, setChapterText]);

  const handleLocationChanged = useCallback((epubcfi) => {
    setCurrentCfi(epubcfi);

    // Derive percent from rendition
    const r = renditionRef.current;
    if (r?.location) {
      try {
        const loc = r.currentLocation();
        if (loc?.start?.percentage != null) {
          setPercentComplete(Math.round(loc.start.percentage * 100));
        }
        // Derive chapter index from TOC
        if (toc.length > 0 && loc?.start?.href) {
          const idx = toc.findIndex((t) => loc.start.href.includes(t.href));
          if (idx >= 0) setCurrentChapter(idx);
        }
      } catch (_) {}
    }
  }, [setCurrentCfi, setPercentComplete, setCurrentChapter, toc]);

  // ── Text selection → highlight popup ────────────────────────────────────
  useEffect(() => {
    const r = renditionRef.current;
    if (!r) return;

    const onSelected = (cfiRange, contents) => {
      const selected = contents.window.getSelection()?.toString()?.trim();
      if (!selected) return;

      r.annotations.add(
        'highlight',
        cfiRange,
        {},
        null,
        'epubjs-hl',
        { fill: '#B8964A', 'fill-opacity': '0.3', 'mix-blend-mode': 'multiply' }
      );
      addHighlight({ cfi: cfiRange, text: selected, color: '#B8964A' });
    };

    r.on('selected', onSelected);
    return () => r.off('selected', onSelected);
  }, [addHighlight]);

  // ── Re-apply existing highlights after render ────────────────────────────
  useEffect(() => {
    const r = renditionRef.current;
    if (!r || !highlights.length) return;
    highlights.forEach((h) => {
      try {
        r.annotations.add(
          'highlight', h.cfi, {}, null, 'epubjs-hl',
          { fill: h.color ?? '#B8964A', 'fill-opacity': '0.3' }
        );
      } catch (_) {}
    });
  }, [highlights]);

  if (!currentBook) return null;

  const containerBg = THEME_BG[theme] ?? THEME_BG.white;

  return (
    <div
      className={`relative w-full h-full min-h-screen ${containerBg}`}
      onClick={toggleToolbar}
    >
      {/* ── EPUB viewer ──────────────────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        onClick={(e) => e.stopPropagation()}
      >
        <ReactReader
          url={currentBook.fileUrl ?? ''}
          location={currentCfi || undefined}
          locationChanged={handleLocationChanged}
          getRendition={handleGetRendition}
          tocChanged={setToc}
          readerStyles={{
            container: { height: '100%' },
            readerArea: {
              background: 'transparent',
              position: 'relative',
              height: '100%',
            },
            titleArea: { display: 'none' },
            tocArea:   { display: 'none' },
          }}
        />
      </div>

      {/* ── Translated text overlay ───────────────────────────────────────── */}
      {translatedContent && (
        <div
          className={`absolute inset-0 overflow-y-auto px-6 py-8 ${containerBg}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-w-2xl mx-auto">
            {translatedContent.split(/\s+/).map((word, i) => (
              <span
                key={i}
                className={
                  i === (ttsWordIndex ?? currentWordIndex)
                    ? 'bg-[#B8964A]/40 rounded px-0.5'
                    : ''
                }
                style={{ fontSize: `${fontSize}px`, lineHeight }}
              >
                {word}{' '}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
