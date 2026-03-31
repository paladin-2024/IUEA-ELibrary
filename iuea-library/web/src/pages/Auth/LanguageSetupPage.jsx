import { useState }   from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCheck } from 'react-icons/fi';
import useAuthStore    from '../../store/authStore';
import api             from '../../services/api';

const LANGUAGES = [
  { code: 'en', name: 'English',     native: 'English',    flag: '🇬🇧' },
  { code: 'sw', name: 'Swahili',     native: 'Kiswahili',  flag: '🇹🇿' },
  { code: 'fr', name: 'French',      native: 'Français',   flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic',      native: 'العربية',    flag: '🇸🇦' },
  { code: 'lg', name: 'Luganda',     native: 'Olu-Ganda',  flag: '🇺🇬' },
  { code: 'rw', name: 'Kinyarwanda', native: 'Kinyarwanda',flag: '🇷🇼' },
  { code: 'so', name: 'Somali',      native: 'Af-Soomaali',flag: '🇸🇴' },
  { code: 'am', name: 'Amharic',     native: 'አማርኛ',      flag: '🇪🇹' },
];

export default function LanguageSetupPage() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();

  const [selected, setSelected] = useState(['en']);
  const [saving,   setSaving]   = useState(false);

  const toggle = (code) => {
    setSelected((prev) =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter((c) => c !== code) : prev  // keep at least one
        : [...prev, code]
    );
  };

  const onContinue = async () => {
    setSaving(true);
    try {
      await api.put('/auth/me', { preferredLanguages: selected.map(codeToName) });
    } catch {
      // Non-fatal — continue to home even if save fails
    }
    setSaving(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      {/* IUEA shield */}
      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-6">
        <span className="text-white font-bold text-lg">IUEA</span>
      </div>

      <h1 className="font-serif text-3xl font-semibold text-primary text-center mb-1">
        Choose your reading languages
      </h1>
      <p className="text-sm text-gray-500 text-center mb-2">
        Powered by Google Translate
      </p>
      <p className="text-xs text-gray-400 text-center mb-10 max-w-sm">
        Select all languages you'd like content translated into.
        You can change this later in Settings.
      </p>

      {/* Grid — 2 col mobile, 4 col desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl mb-10">
        {LANGUAGES.map(({ code, name, native, flag }) => {
          const isSelected = selected.includes(code);
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              className={[
                'relative flex flex-col items-center justify-center gap-2 p-4 rounded-card',
                'border-2 transition-all text-center',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-white hover:border-gray-300',
              ].join(' ')}
            >
              {/* Checkmark badge */}
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full
                                  flex items-center justify-center">
                  <FiCheck size={11} className="text-white" />
                </span>
              )}
              <span className="text-3xl leading-none">{flag}</span>
              <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                {name}
              </span>
              <span className="text-xs text-gray-400">{native}</span>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        disabled={saving}
        className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-btn
                   text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Continue to Library'}
        <FiArrowRight size={16} />
      </button>

      <button
        onClick={() => navigate('/home')}
        className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
      >
        Skip for now
      </button>

      <p className="mt-10 text-xs text-gray-300 text-center">
        International University of East Africa
      </p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function codeToName(code) {
  return LANGUAGES.find((l) => l.code === code)?.name ?? code;
}
