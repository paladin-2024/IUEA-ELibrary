import { useState } from 'react';
import { MdTranslate, MdClose, MdWarning } from 'react-icons/md';
import useReaderStore  from '../../store/readerStore';
import useTranslation  from '../../hooks/useTranslation';

const LANGUAGES = [
  { code: 'en',  name: 'English',    flag: '🇬🇧', native: 'English' },
  { code: 'fr',  name: 'French',     flag: '🇫🇷', native: 'Français' },
  { code: 'ar',  name: 'Arabic',     flag: '🇸🇦', native: 'العربية' },
  { code: 'sw',  name: 'Swahili',    flag: '🇹🇿', native: 'Kiswahili' },
  { code: 'lg',  name: 'Luganda',    flag: '🇺🇬', native: 'Luganda' },
  { code: 'es',  name: 'Spanish',    flag: '🇪🇸', native: 'Español' },
  { code: 'pt',  name: 'Portuguese', flag: '🇧🇷', native: 'Português' },
  { code: 'hi',  name: 'Hindi',      flag: '🇮🇳', native: 'हिन्दी' },
];

export default function LanguageSwitcher({ bookId }) {
  const {
    readingLanguage, currentChapterText, theme,
    setReadingLanguage, setTranslatedContent, toggleLanguageSwitcher,
  } = useReaderStore();
  const { translate, isTranslating } = useTranslation();
  const [error, setError] = useState(null);

  const bgColor   = theme === 'dark' ? '#1A1A2E' : theme === 'sepia' ? '#F4E4C1' : '#fff';
  const textColor = theme === 'dark' ? '#E0E0E0' : '#1A1A1A';

  const handleSelect = async (lang) => {
    setReadingLanguage(lang.code);
    setError(null);

    if (lang.code === 'en') {
      setTranslatedContent(null);
      toggleLanguageSwitcher();
      return;
    }

    const sourceText = currentChapterText;
    if (!sourceText) {
      toggleLanguageSwitcher();
      return;
    }

    const result = await translate(sourceText, lang.code, 'en');
    if (result) {
      setTranslatedContent(result);
      toggleLanguageSwitcher();
    } else {
      setError(`Could not translate to ${lang.name}. MyMemory may not support this language pair.`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={toggleLanguageSwitcher}
    >
      <div
        className="rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto"
        style={{ background: bgColor, color: textColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MdTranslate size={20} style={{ color: '#7B0D1E' }} />
            <h3 className="font-semibold text-base">Reading Language</h3>
          </div>
          <button onClick={toggleLanguageSwitcher} className="p-1 hover:bg-black/5 rounded-lg">
            <MdClose size={20} />
          </button>
        </div>

        {/* Warning */}
        <div className="flex gap-2 p-3 rounded-lg mb-4" style={{ background: '#FEF3C7' }}>
          <MdWarning size={16} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Machine translation via MyMemory API. Quality varies. English is recommended for academic reading.
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 mb-3 px-1">{error}</p>
        )}

        {/* Language list */}
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((lang) => {
            const isSelected = readingLanguage === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang)}
                disabled={isTranslating}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                  isSelected ? 'border-primary bg-primary/5' : 'hover:bg-black/5'
                }`}
                style={{ borderColor: isSelected ? '#7B0D1E' : undefined, opacity: isTranslating ? 0.6 : 1 }}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{lang.name}</p>
                  <p className="text-xs opacity-50 truncate">{lang.native}</p>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 rounded-full ml-auto shrink-0" style={{ background: '#7B0D1E' }} />
                )}
              </button>
            );
          })}
        </div>

        {isTranslating && (
          <div className="flex items-center justify-center gap-2 mt-4 py-2">
            <div className="animate-spin w-4 h-4 rounded-full border-2 border-primary border-t-transparent" style={{ borderColor: '#7B0D1E', borderTopColor: 'transparent' }} />
            <p className="text-sm opacity-70">Translating…</p>
          </div>
        )}

        {/* Attribution */}
        <p className="text-center text-[10px] opacity-40 mt-4">
          Powered by MyMemory Translation API
        </p>
      </div>
    </div>
  );
}
