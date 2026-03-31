import { useNavigate }   from 'react-router-dom';
import {
  MdArrowBack, MdOutlineMenuBook, MdTranslate,
  MdTextFields, MdBrightness4, MdVolumeUp, MdChat,
} from 'react-icons/md';
import useReaderStore, { READER_THEMES } from '../../store/readerStore';

export default function ReaderToolbar({ bookId, percentComplete }) {
  const navigate = useNavigate();
  const {
    theme, showTOC, showChatbot, showLanguageSwitcher, showFontPanel,
    toggleTOC, toggleChatbot, toggleLanguageSwitcher, toggleFontPanel,
    readingMode, setReadingMode, saveProgress,
  } = useReaderStore();

  const t         = READER_THEMES[theme] || READER_THEMES.light;
  const isActive  = (flag) => flag ? 'text-primary' : '';
  const btnClass  = 'flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors hover:bg-black/5';

  const handleBack = () => {
    saveProgress(bookId);
    navigate(-1);
  };

  const handleAudio = () => {
    if (readingMode === 'audio') {
      setReadingMode('read');
    } else {
      navigate(`/reader/${bookId}?mode=audio`);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background:   t.background,
        borderTop:    `1px solid ${t.borderColor}`,
        color:        t.color,
      }}
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-200/50">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${percentComplete}%`, background: '#7B0D1E' }}
        />
      </div>

      {/* Buttons row */}
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        <button onClick={handleBack} className={btnClass} title="Back">
          <MdArrowBack size={22} />
          <span className="text-[9px] opacity-60">Back</span>
        </button>

        <button onClick={toggleTOC} className={`${btnClass} ${isActive(showTOC)}`} title="Contents">
          <MdOutlineMenuBook size={22} style={showTOC ? { color: '#7B0D1E' } : {}} />
          <span className="text-[9px] opacity-60">Contents</span>
        </button>

        <button onClick={toggleLanguageSwitcher} className={`${btnClass} ${isActive(showLanguageSwitcher)}`} title="Translate">
          <MdTranslate size={22} style={showLanguageSwitcher ? { color: '#7B0D1E' } : {}} />
          <span className="text-[9px] opacity-60">Translate</span>
        </button>

        <button onClick={toggleFontPanel} className={`${btnClass} ${isActive(showFontPanel)}`} title="Font">
          <MdTextFields size={22} style={showFontPanel ? { color: '#7B0D1E' } : {}} />
          <span className="text-[9px] opacity-60">Font</span>
        </button>

        <button onClick={() => useReaderStore.getState().setTheme(
          theme === 'light' ? 'sepia' : theme === 'sepia' ? 'dark' : 'light'
        )} className={btnClass} title="Theme">
          <MdBrightness4 size={22} />
          <span className="text-[9px] opacity-60">Theme</span>
        </button>

        <button onClick={handleAudio} className={`${btnClass} ${isActive(readingMode === 'audio')}`} title="Listen">
          <MdVolumeUp size={22} style={readingMode === 'audio' ? { color: '#7B0D1E' } : {}} />
          <span className="text-[9px] opacity-60">Listen</span>
        </button>

        <button onClick={toggleChatbot} className={`${btnClass} ${isActive(showChatbot)}`} title="AI Assistant">
          <MdChat size={22} style={showChatbot ? { color: '#7B0D1E' } : {}} />
          <span className="text-[9px] opacity-60">Ask AI</span>
        </button>
      </div>
    </div>
  );
}
