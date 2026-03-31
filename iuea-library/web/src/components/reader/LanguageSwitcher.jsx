import { useRef, useEffect } from 'react';
import { FiAlertCircle, FiX } from 'react-icons/fi';
import { MdTranslate }        from 'react-icons/md';
import useReaderStore         from '../../store/readerStore';
import useTranslation         from '../../hooks/useTranslation';
import LANGUAGES              from '../../../../shared/languages.json';

export default function LanguageSwitcher({ bookId }) {
  const sheetRef = useRef(null);

  const {
    readingLanguage, currentChapterText, currentChapter,
    setReadingLanguage, setTranslatedContent, setIsTranslating,
    toggleLanguageSwitcher,
  } = useReaderStore();

  const { translateChapter, isTranslating } = useTranslation();

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) toggleLanguageSwitcher();
  };

  const handleSelect = async (lang) => {
    if (lang.name === readingLanguage) {
      toggleLanguageSwitcher();
      return;
    }

    if (lang.code === 'en') {
      // Reset to English — clear translation
      setReadingLanguage('English');
      setTranslatedContent(null);
      toggleLanguageSwitcher();
      return;
    }

    setIsTranslating(true);
    const result = await translateChapter(
      currentChapterText,
      lang.name,   // server resolves names to codes via langMap
      bookId,
      currentChapter
    );
    setIsTranslating(false);

    if (result) {
      setReadingLanguage(lang.name);
      setTranslatedContent(result);
    }
    toggleLanguageSwitcher();
  };

  return (
    // ── Backdrop ─────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={handleBackdrop}
    >
      {/* ── Sheet / modal ─────────────────────────────────────────────── */}
      <div
        ref={sheetRef}
        className="bg-white w-full sm:w-96 sm:rounded-2xl rounded-t-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MdTranslate size={20} className="text-primary" />
            <span className="font-semibold text-gray-800">Switch Language</span>
          </div>
          <button
            onClick={toggleLanguageSwitcher}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <FiX size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Warning */}
        <div className="mx-4 mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <FiAlertCircle size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Machine translation via MyMemory API. Quality may vary — recommended for
            browsing only, not academic citation.
          </p>
        </div>

        {/* Attribution */}
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Free translation by MyMemory · mymemory.translated.net
        </p>

        {/* Language list */}
        <div className="flex-1 overflow-y-auto py-2">
          {isTranslating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Translating chapter…</p>
            </div>
          ) : (
            LANGUAGES.map((lang) => {
              const isActive = lang.name === readingLanguage;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleSelect(lang)}
                  className={`w-full flex items-center gap-3 px-5 py-3 transition-colors text-left
                    ${isActive
                      ? 'bg-primary/5 border-l-2 border-primary'
                      : 'hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                >
                  <span className="text-2xl leading-none">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{lang.name}</p>
                    <p className="text-xs text-gray-400">{lang.native}</p>
                  </div>
                  {isActive && (
                    <span className="text-xs font-semibold text-primary px-2 py-0.5 bg-primary/10 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
