import { useState }                          from 'react';
import { useNavigate, useSearchParams }      from 'react-router-dom';
import useReaderStore                        from '../../store/readerStore';

/* ─────────────────────────────────────────────────────────────────────────────
   ReaderToolbar — floating pill + slide-up settings drawer
   ───────────────────────────────────────────────────────────────────────────── */
export default function ReaderToolbar({ bookId, theme: t = {} }) {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const mode           = searchParams.get('mode') ?? 'read';
  const [showSettings, setShowSettings] = useState(false);

  const {
    currentCfi, bookmarks,
    readingLanguage, translatedContent,
    showChatbot, showLanguageSwitcher,
    addBookmark, removeBookmark,
    toggleLanguageSwitcher, toggleChatbot,
    saveProgress,
  } = useReaderStore();

  const isBookmarked = bookmarks.includes(currentCfi);

  const toggleAudio = () => {
    saveProgress(bookId);
    const next = mode === 'audio' ? 'read' : 'audio';
    navigate(`/reader/${bookId}?mode=${next}`, { replace: true });
  };

  const toggleBookmark = () => {
    isBookmarked ? removeBookmark(currentCfi) : addBookmark(currentCfi);
  };

  const bg        = t.bg === '#141010' ? 'rgba(30,22,24,0.95)' : 'rgba(255,255,255,0.95)';
  const iconColor = t.text ?? '#1a0609';

  const actions = [
    {
      id: 'listen',
      icon: mode === 'audio' ? 'pause_circle' : 'headphones',
      label: mode === 'audio' ? 'Pause' : 'Listen',
      active: mode === 'audio',
      onClick: toggleAudio,
    },
    {
      id: 'translate',
      icon: 'translate',
      label: 'Translate',
      active: showLanguageSwitcher || readingLanguage !== 'English',
      onClick: toggleLanguageSwitcher,
    },
    {
      id: 'bookmark',
      icon: isBookmarked ? 'bookmark' : 'bookmark_border',
      label: isBookmarked ? 'Saved' : 'Bookmark',
      active: isBookmarked,
      onClick: toggleBookmark,
    },
    {
      id: 'ai',
      icon: 'smart_toy',
      label: 'Ask AI',
      active: showChatbot,
      onClick: toggleChatbot,
    },
    {
      id: 'settings',
      icon: 'tune',
      label: 'Settings',
      active: showSettings,
      onClick: () => setShowSettings(s => !s),
    },
  ];

  return (
    <>
      {/* ── Settings drawer (slide up) ──────────────────────────────────── */}
      {showSettings && (
        <>
          <div
            onClick={() => setShowSettings(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 48 }}
          />
          <SettingsDrawer
            theme={t}
            iconColor={iconColor}
            onClose={() => setShowSettings(false)}
          />
        </>
      )}

      {/* ── Floating pill toolbar ──────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
        zIndex: 49,
        background: bg,
        backdropFilter: 'blur(20px)',
        borderRadius: 99,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        border: `1px solid ${t.border ?? 'rgba(223,191,190,0.4)'}`,
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 10px',
      }}>
        {actions.map((a) => (
          <ToolBtn key={a.id} {...a} iconColor={iconColor} />
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ToolBtn — individual pill action button
   ───────────────────────────────────────────────────────────────────────────── */
function ToolBtn({ icon, label, active, onClick, iconColor }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, padding: '6px 10px', borderRadius: 90, border: 'none',
        cursor: 'pointer',
        background: active
          ? '#7b0d1e'
          : hov ? 'rgba(123,13,30,0.08)' : 'transparent',
        transition: 'background 0.18s ease',
        minWidth: 48,
      }}
    >
      <span className="material-symbols-outlined" style={{
        fontSize: 20,
        color: active ? '#fff' : (hov ? '#7b0d1e' : iconColor),
        fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
        transition: 'color 0.18s ease',
      }}>{icon}</span>
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 9, fontWeight: 600, letterSpacing: '0.02em',
        color: active ? '#fff' : (hov ? '#7b0d1e' : iconColor),
        opacity: active ? 1 : 0.65,
        transition: 'color 0.18s ease',
        userSelect: 'none',
      }}>{label}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SettingsDrawer — slide-up panel with font/theme/spacing controls
   ───────────────────────────────────────────────────────────────────────────── */
function SettingsDrawer({ theme: t, iconColor, onClose }) {
  const {
    fontSize, lineHeight, fontFamily, theme,
    setFontSize, setLineHeight, setFontFamily, setTheme,
  } = useReaderStore();

  const panelBg = t.panel ?? '#f9f4f4';
  const border  = t.border ?? 'rgba(223,191,190,0.4)';

  const FONTS = [
    { key: 'serif', label: 'Serif', sample: 'Playfair Display, Georgia, serif' },
    { key: 'sans',  label: 'Sans',  sample: 'Inter, system-ui, sans-serif' },
    { key: 'mono',  label: 'Mono',  sample: 'JetBrains Mono, monospace' },
  ];

  const THEMES = [
    { key: 'white', label: 'Light',  swatch: '#ffffff', text: '#1a0609' },
    { key: 'sepia', label: 'Sepia',  swatch: '#f8f0e0', text: '#3d2005' },
    { key: 'dark',  label: 'Dark',   swatch: '#141010', text: '#e8d8d9' },
  ];

  const rowLabel = {
    fontFamily: 'Inter, sans-serif',
    fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
    color: '#7b0d1e', textTransform: 'uppercase',
    marginBottom: 10, display: 'block',
  };

  const divider = { height: 1, background: border, margin: '16px 0' };

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50,
      width: 'min(380px, calc(100vw - 32px))',
      background: panelBg,
      borderRadius: 20,
      boxShadow: '0 -4px 40px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.08)',
      border: `1px solid ${border}`,
      padding: '20px 20px 16px',
      backdropFilter: 'blur(20px)',
      animation: 'settingsSlideUp 0.25s cubic-bezier(.22,1,.36,1)',
    }}>
      <style>{`@keyframes settingsSlideUp { from { opacity:0; transform:translateX(-50%) translateY(16px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 16, fontWeight: 700, color: iconColor,
        }}>Reading Settings</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: iconColor, opacity: 0.5, padding: 4,
          display: 'flex', alignItems: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
        </button>
      </div>

      {/* Font size */}
      <span style={rowLabel}>Font size</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
        <button
          onClick={() => setFontSize(Math.max(12, fontSize - 2))}
          style={stepBtn(iconColor)}
        >
          <span style={{ fontFamily: 'serif', fontSize: 14, fontWeight: 700 }}>A</span>
        </button>
        <div style={{ flex: 1, position: 'relative', height: 4, background: border, borderRadius: 99 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${((fontSize - 12) / (32 - 12)) * 100}%`,
            background: 'linear-gradient(90deg,#7b0d1e,#c9a84c)',
            borderRadius: 99,
          }} />
        </div>
        <button
          onClick={() => setFontSize(Math.min(32, fontSize + 2))}
          style={stepBtn(iconColor)}
        >
          <span style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700 }}>A</span>
        </button>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 700,
          color: '#7b0d1e', minWidth: 28, textAlign: 'right',
        }}>{fontSize}px</span>
      </div>

      <div style={divider} />

      {/* Line height */}
      <span style={rowLabel}>Line spacing</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {[1.4, 1.6, 1.8, 2.0].map(v => (
          <button key={v} onClick={() => setLineHeight(v)} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: lineHeight === v ? '#7b0d1e' : 'rgba(123,13,30,0.07)',
            color: lineHeight === v ? '#fff' : iconColor,
            fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
            transition: 'background 0.18s ease, color 0.18s ease',
          }}>
            {v}×
          </button>
        ))}
      </div>

      <div style={divider} />

      {/* Typeface */}
      <span style={rowLabel}>Typeface</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {FONTS.map(({ key, label, sample }) => (
          <button key={key} onClick={() => setFontFamily(key)} style={{
            flex: 1, padding: '8px 4px', borderRadius: 8,
            border: `1.5px solid ${fontFamily === key ? '#7b0d1e' : border}`,
            background: fontFamily === key ? 'rgba(123,13,30,0.06)' : 'transparent',
            cursor: 'pointer', textAlign: 'center',
            transition: 'border-color 0.18s ease, background 0.18s ease',
          }}>
            <span style={{
              display: 'block', fontFamily: sample,
              fontSize: 16, color: fontFamily === key ? '#7b0d1e' : iconColor,
              lineHeight: 1.1, marginBottom: 3,
            }}>Aa</span>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600,
              color: fontFamily === key ? '#7b0d1e' : iconColor, opacity: 0.7,
            }}>{label}</span>
          </button>
        ))}
      </div>

      <div style={divider} />

      {/* Theme */}
      <span style={rowLabel}>Theme</span>
      <div style={{ display: 'flex', gap: 8 }}>
        {THEMES.map(({ key, label, swatch, text: swText }) => (
          <button key={key} onClick={() => setTheme(key)} style={{
            flex: 1, padding: '10px 4px', borderRadius: 10,
            background: swatch,
            border: `2px solid ${theme === key ? '#7b0d1e' : 'transparent'}`,
            boxShadow: theme === key
              ? '0 0 0 2px rgba(123,13,30,0.25)'
              : '0 1px 4px rgba(0,0,0,0.12)',
            cursor: 'pointer', textAlign: 'center',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
          }}>
            <span style={{
              display: 'block',
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 12, fontWeight: 700, color: swText,
            }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* helper */
const stepBtn = (color) => ({
  width: 34, height: 34, borderRadius: '50%', border: 'none',
  background: 'rgba(123,13,30,0.08)', color,
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', flexShrink: 0,
});
