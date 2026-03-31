import { useNavigate, useSearchParams } from 'react-router-dom';
import { MdFormatSize, MdBrightness6, MdTranslate, MdHighlight } from 'react-icons/md';
import { BsMicFill }       from 'react-icons/bs';
import { FiBookmark }      from 'react-icons/fi';
import { AiOutlineRobot }  from 'react-icons/ai';
import useReaderStore      from '../../store/readerStore';

const THEMES_CYCLE = ['white', 'sepia', 'dark'];

export default function ReaderToolbar({ bookId }) {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const mode           = searchParams.get('mode') ?? 'read';

  const {
    percentComplete, theme, readingLanguage, translatedContent,
    currentCfi, bookmarks,
    showFontPanel, showLanguageSwitcher, showChatbot,
    setTheme, addBookmark, removeBookmark,
    toggleFontPanel, toggleLanguageSwitcher, toggleChatbot,
    saveProgress,
  } = useReaderStore();

  const cycleTheme = () => {
    const idx  = THEMES_CYCLE.indexOf(theme);
    const next = THEMES_CYCLE[(idx + 1) % THEMES_CYCLE.length];
    setTheme(next);
  };

  const toggleAudio = () => {
    saveProgress(bookId);
    const next = mode === 'audio' ? 'read' : 'audio';
    navigate(`/reader/${bookId}?mode=${next}`, { replace: true });
  };

  const isBookmarked = bookmarks.includes(currentCfi);
  const toggleBookmark = () => {
    isBookmarked ? removeBookmark(currentCfi) : addBookmark(currentCfi);
  };

  const btn = (active = false) =>
    `flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors
     ${active
       ? 'text-primary'
       : 'text-gray-500 hover:text-primary hover:bg-primary/5'}`;

  const label = 'text-[9px] leading-none font-medium select-none';

  return (
    <div className="fixed bottom-0 inset-x-0 z-40">
      {/* ── 7 action buttons ─────────────────────────────────────────────── */}
      <div className="bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="flex items-center justify-around px-1 py-1 max-w-xl mx-auto">

          {/* Font size */}
          <button onClick={toggleFontPanel} className={btn(showFontPanel)} title="Font size">
            <MdFormatSize size={22} />
            <span className={label}>Font</span>
          </button>

          {/* Theme */}
          <button onClick={cycleTheme} className={btn()} title="Switch theme">
            <MdBrightness6 size={22} />
            <span className={label}>Theme</span>
          </button>

          {/* Audio / TTS */}
          <button onClick={toggleAudio} className={btn(mode === 'audio')} title="Listen">
            <BsMicFill size={20} />
            <span className={label}>Listen</span>
          </button>

          {/* Translate */}
          <button
            onClick={toggleLanguageSwitcher}
            className={btn(showLanguageSwitcher || readingLanguage !== 'English')}
            title="Translate"
          >
            <MdTranslate size={22} />
            <span className={label}>Translate</span>
          </button>

          {/* Bookmark */}
          <button onClick={toggleBookmark} className={btn(isBookmarked)} title="Bookmark">
            <FiBookmark size={20} className={isBookmarked ? 'fill-primary' : ''} />
            <span className={label}>{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          {/* Highlight (selection-based — activated automatically) */}
          <button className={btn(!!translatedContent)} title="Highlights" disabled>
            <MdHighlight size={22} />
            <span className={label}>Highlights</span>
          </button>

          {/* AI Chatbot */}
          <button onClick={toggleChatbot} className={btn(showChatbot)} title="AI Assistant">
            <AiOutlineRobot size={22} />
            <span className={label}>Ask AI</span>
          </button>
        </div>
      </div>

      {/* ── Maroon progress bar ────────────────────────────────────────────── */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(100, percentComplete)}%` }}
        />
      </div>

      {/* ── Font panel ────────────────────────────────────────────────────── */}
      {showFontPanel && <FontPanel />}
    </div>
  );
}

function FontPanel() {
  const {
    fontSize, lineHeight, fontFamily, theme,
    setFontSize, setLineHeight, setFontFamily, setTheme,
    toggleFontPanel,
  } = useReaderStore();

  const rowLabel = 'text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2';

  return (
    <div
      className="bg-white border-t border-gray-200 px-4 pt-3 pb-4 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Font size */}
      <p className={rowLabel}>Font size</p>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setFontSize(fontSize - 2)}
          className="w-8 h-8 rounded-full border border-gray-300 text-sm font-bold text-gray-600 flex items-center justify-center"
        >A−</button>
        <span className="flex-1 text-center text-sm text-gray-700">{fontSize}px</span>
        <button
          onClick={() => setFontSize(fontSize + 2)}
          className="w-8 h-8 rounded-full border border-gray-300 text-sm font-bold text-gray-600 flex items-center justify-center"
        >A+</button>
      </div>

      {/* Font family */}
      <p className={rowLabel}>Typeface</p>
      <div className="flex gap-2 mb-4">
        {[
          { key: 'serif', label: 'Serif' },
          { key: 'sans',  label: 'Sans' },
          { key: 'mono',  label: 'Mono' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFontFamily(key)}
            className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
              fontFamily === key
                ? 'border-primary text-primary bg-primary/5 font-semibold'
                : 'border-gray-300 text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Theme */}
      <p className={rowLabel}>Theme</p>
      <div className="flex gap-2">
        {[
          { key: 'white', label: 'White', bg: 'bg-white',       border: 'border-gray-300' },
          { key: 'sepia', label: 'Sepia', bg: 'bg-[#F5ECD7]',   border: 'border-[#C9A07A]' },
          { key: 'dark',  label: 'Dark',  bg: 'bg-[#1A1A2E]',   border: 'border-[#444]' },
        ].map(({ key, label, bg, border }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            className={`flex-1 py-2 text-xs rounded-lg border-2 transition-all ${bg} ${border} ${
              theme === key ? 'ring-2 ring-primary ring-offset-1' : ''
            } ${key === 'dark' ? 'text-white' : 'text-gray-800'}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
