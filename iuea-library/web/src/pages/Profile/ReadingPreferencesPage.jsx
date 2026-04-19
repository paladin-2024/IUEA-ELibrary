import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';

const PREF_KEY = 'iuea_reading_prefs';

const FONTS = [
  { id: 'serif',    label: 'Serif',    sample: 'Aa', className: 'font-serif' },
  { id: 'sans',     label: 'Sans',     sample: 'Aa', className: 'font-sans'  },
  { id: 'dyslexic', label: 'Dyslexic', sample: 'Aa', className: 'font-sans tracking-wide' },
];

const THEMES = [
  { id: 'white', label: 'White', bg: '#FFFFFF', text: '#1A1A1A', border: '#E5E7EB' },
  { id: 'sepia', label: 'Sepia', bg: '#F5ECD7', text: '#3B2F1A', border: '#D4B896' },
  { id: 'dark',  label: 'Dark',  bg: '#1A1A1A', text: '#E5E5E5', border: '#374151' },
];

const LINE_HEIGHTS = [
  { id: 'compact',  label: 'Compact',  value: '1.4' },
  { id: 'normal',   label: 'Normal',   value: '1.7' },
  { id: 'relaxed',  label: 'Relaxed',  value: '2.0' },
];

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}'); }
  catch { return {}; }
}

export default function ReadingPreferencesPage() {
  const navigate = useNavigate();

  const saved                      = loadPrefs();
  const [font,       setFont]      = useState(saved.font        ?? 'serif');
  const [fontSize,   setFontSize]  = useState(saved.fontSize    ?? 18);
  const [lineHeight, setLineHeight]= useState(saved.lineHeight  ?? 'normal');
  const [theme,      setTheme]     = useState(saved.theme       ?? 'white');
  const [autoSave,   setAutoSave]  = useState(saved.autoSave    ?? true);
  const [offline,    setOffline]   = useState(saved.offline     ?? false);
  const [saved_,     setSaved_]    = useState(false);

  // Auto-save debounced
  useEffect(() => {
    const prefs = { font, fontSize, lineHeight, theme, autoSave, offline };
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
    setSaved_(true);
    const t = setTimeout(() => setSaved_(false), 1500);
    return () => clearTimeout(t);
  }, [font, fontSize, lineHeight, theme, autoSave, offline]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-blush-100 transition-colors"
        >
          <FiArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="font-serif text-xl font-bold text-primary flex-1">Reading Preferences</h1>
        {saved_ && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <FiCheck size={13} /> Saved
          </span>
        )}
      </div>

      <div className="space-y-5">
        {/* ── Font family ────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Font Family</h2>
          <div className="grid grid-cols-3 gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFont(f.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-btn border transition-colors ${
                  font === f.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`text-2xl text-gray-800 ${f.className}`}>{f.sample}</span>
                <span className={`text-xs font-medium ${font === f.id ? 'text-primary' : 'text-gray-500'}`}>
                  {f.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Font size ──────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Font Size</h2>
            <span className="text-sm font-bold text-primary">{fontSize}px</span>
          </div>
          <input
            type="range"
            min={14}
            max={24}
            step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>14px</span>
            <span>24px</span>
          </div>
          <p
            className="mt-3 text-gray-600 leading-relaxed p-3 bg-white rounded-lg"
            style={{ fontSize: `${fontSize}px` }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
        </section>

        {/* ── Line height ────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Line Height</h2>
          <div className="flex gap-2">
            {LINE_HEIGHTS.map((lh) => (
              <button
                key={lh.id}
                onClick={() => setLineHeight(lh.id)}
                className={`flex-1 py-2 rounded-btn text-sm font-medium border transition-colors ${
                  lineHeight === lh.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {lh.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Theme ──────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Theme</h2>
          <div className="flex gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-btn border-2 transition-colors ${
                  theme === t.id ? 'border-primary' : 'border-gray-200'
                }`}
                style={{ background: t.bg }}
              >
                <span className="text-xs font-semibold" style={{ color: t.text }}>{t.label}</span>
                {theme === t.id && (
                  <FiCheck size={13} className="text-primary" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* ── Toggles ────────────────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card divide-y divide-gray-100">
          <ToggleRow
            label="Auto-save position"
            sub="Resume where you left off"
            checked={autoSave}
            onChange={setAutoSave}
          />
          <ToggleRow
            label="Offline reading"
            sub="Cache books for offline access"
            checked={offline}
            onChange={setOffline}
          />
        </section>
      </div>
    </div>
  );
}

function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <label className="flex items-center justify-between px-4 py-3.5 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-primary' : 'bg-gray-300'
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </label>
  );
}
