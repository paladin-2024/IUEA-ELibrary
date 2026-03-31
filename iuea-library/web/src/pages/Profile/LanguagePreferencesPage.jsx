import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import { MdTranslate, MdRecordVoiceOver } from 'react-icons/md';
import useAuthStore            from '../../store/authStore';
import api                     from '../../services/api';

const LANG_PREF_KEY = 'iuea_lang_prefs';

const LANGUAGES = [
  { code: 'en',  name: 'English'    },
  { code: 'fr',  name: 'French'     },
  { code: 'sw',  name: 'Swahili'    },
  { code: 'lg',  name: 'Luganda'    },
  { code: 'ar',  name: 'Arabic'     },
  { code: 'zh',  name: 'Chinese'    },
  { code: 'pt',  name: 'Portuguese' },
  { code: 'es',  name: 'Spanish'    },
  { code: 'de',  name: 'German'     },
];

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LANG_PREF_KEY) ?? '{}'); }
  catch { return {}; }
}

export default function LanguagePreferencesPage() {
  const navigate              = useNavigate();
  const { user, updateUser }  = useAuthStore();

  const saved                         = loadPrefs();
  const [primary,   setPrimary]       = useState(saved.primary   ?? user?.language ?? 'en');
  const [autoTrans, setAutoTrans]     = useState(saved.autoTrans ?? false);
  const [ttsLang,   setTtsLang]       = useState(saved.ttsLang   ?? 'en');
  const [aiLang,    setAiLang]        = useState(saved.aiLang    ?? 'en');
  const [saving,    setSaving]        = useState(false);
  const [saved_,    setSaved_]        = useState(false);

  // persist locally on every change
  useEffect(() => {
    const prefs = { primary, autoTrans, ttsLang, aiLang };
    localStorage.setItem(LANG_PREF_KEY, JSON.stringify(prefs));
  }, [primary, autoTrans, ttsLang, aiLang]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', { language: primary });
      if (updateUser) updateUser(data.user);
      setSaved_(true);
      setTimeout(() => setSaved_(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-surface transition-colors"
        >
          <FiArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="font-serif text-xl font-bold text-primary flex-1">Language Preferences</h1>
        {saved_ && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <FiCheck size={13} /> Saved
          </span>
        )}
      </div>

      <div className="space-y-5">
        {/* ── Primary language ───────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <MdTranslate size={15} className="text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">Primary Language</h2>
          </div>
          <select
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1.5">
            Sets the default language for the library interface.
          </p>
        </section>

        {/* ── Auto-translate ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-gray-700">Auto-translate content</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Translate book summaries &amp; descriptions to your primary language
              </p>
            </div>
            <div
              onClick={() => setAutoTrans(!autoTrans)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                autoTrans ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  autoTrans ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </label>
          {autoTrans && (
            <p className="mt-2 text-[11px] text-gray-400 bg-surface rounded-lg px-3 py-2">
              Translations powered by MyMemory API. Accuracy may vary.
            </p>
          )}
        </section>

        {/* ── TTS voice language ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <MdRecordVoiceOver size={15} className="text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">Text-to-Speech Language</h2>
          </div>
          <select
            value={ttsLang}
            onChange={(e) => setTtsLang(e.target.value)}
            className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1.5">
            Language used when reading text aloud in the book reader.
          </p>
        </section>

        {/* ── AI chatbot reply language ──────────────────────────────────────── */}
        <section className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <MdTranslate size={15} className="text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">AI Chatbot Reply Language</h2>
          </div>
          <select
            value={aiLang}
            onChange={(e) => setAiLang(e.target.value)}
            className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1.5">
            The IUEA AI assistant will respond in this language.
          </p>
        </section>

        {/* ── Save button ────────────────────────────────────────────────────── */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-btn bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
