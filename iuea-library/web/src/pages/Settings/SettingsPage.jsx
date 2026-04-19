import { useState, useEffect }    from 'react';
import { useSearchParams }        from 'react-router-dom';
import useAuthStore               from '../../store/authStore';
import useReaderStore             from '../../store/readerStore';
import api                        from '../../services/api';

/* ─────────────────────────────────────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────────────────────────────────────── */
const LANG_PREF_KEY  = 'iuea_lang_prefs';
const NOTIF_PREF_KEY = 'iuea_notif_prefs';

const LANGUAGES = [
  { code: 'en', name: 'English'    },
  { code: 'fr', name: 'French'     },
  { code: 'sw', name: 'Swahili'    },
  { code: 'lg', name: 'Luganda'    },
  { code: 'ar', name: 'Arabic'     },
  { code: 'zh', name: 'Chinese'    },
  { code: 'pt', name: 'Portuguese' },
  { code: 'es', name: 'Spanish'    },
  { code: 'de', name: 'German'     },
];

const TABS = [
  { id: 'account',       icon: 'person',        label: 'Account'    },
  { id: 'reading',       icon: 'menu_book',      label: 'Reading'    },
  { id: 'language',      icon: 'translate',      label: 'Language'   },
  { id: 'notifications', icon: 'notifications',  label: 'Alerts'     },
  { id: 'about',         icon: 'info',           label: 'About'      },
];

/* ─────────────────────────────────────────────────────────────────────────────
   SettingsPage
   ───────────────────────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') ?? 'account');

  const switchTab = (id) => {
    setActiveTab(id);
    setSearchParams(id === 'account' ? {} : { tab: id });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* ── Page title ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 28, fontWeight: 800, color: '#1a0609', margin: 0, lineHeight: 1.1,
        }}>Settings</h1>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#8b7170', marginTop: 4,
        }}>Manage your account and preferences</p>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 6,
        background: '#fff', borderRadius: 14, padding: 5,
        boxShadow: '0 2px 8px rgba(86,0,15,0.07)',
        border: '1px solid rgba(223,191,190,0.3)',
        marginBottom: '1.5rem',
        overflowX: 'auto',
      }}>
        {TABS.map(({ id, icon, label }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => switchTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, border: 'none',
              background: active ? '#7b0d1e' : 'transparent',
              color: active ? '#fff' : '#8b7170',
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'background 0.18s ease, color 0.18s ease',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 16,
                fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0",
              }}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tab panels ──────────────────────────────────────────────────────── */}
      {activeTab === 'account'       && <AccountTab />}
      {activeTab === 'reading'       && <ReadingTab />}
      {activeTab === 'language'      && <LanguageTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
      {activeTab === 'about'         && <AboutTab />}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AccountTab
   ───────────────────────────────────────────────────────────────────────────── */
function AccountTab() {
  const { user, updateUser } = useAuthStore();
  const [name,     setName]    = useState(user?.name    ?? '');
  const [email,    setEmail]   = useState(user?.email   ?? '');
  const [goal,     setGoal]    = useState(user?.readingGoal ?? 12);
  const [saving,   setSaving]  = useState(false);
  const [saved,    setSaved]   = useState(false);

  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', { name, readingGoal: goal });
      if (updateUser) updateUser(data.user ?? data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Avatar */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #c9a84c, #e6c96a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(123,13,30,0.15)',
            overflow: 'hidden',
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:24, fontWeight:800, color:'#3d2900' }}>{initials}</span>
            }
          </div>
          <div>
            <p style={fieldLabel}>Profile Photo</p>
            <p style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'#8b7170', margin:0 }}>
              Photo upload coming soon
            </p>
          </div>
        </div>
      </Card>

      {/* Name & email */}
      <Card title="Personal Info">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Full Name">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              placeholder="Your name"
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              disabled
              style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }}
            />
            <p style={{ fontFamily:'Inter, sans-serif', fontSize:11, color:'#8b7170', margin:'4px 0 0' }}>
              Email changes require support
            </p>
          </Field>
          {user?.studentId && (
            <Field label="Student ID">
              <input value={user.studentId} disabled style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }} />
            </Field>
          )}
          {user?.faculty && (
            <Field label="Faculty / Department">
              <input value={user.faculty} disabled style={{ ...inputStyle, opacity: 0.55, cursor: 'not-allowed' }} />
            </Field>
          )}
        </div>
      </Card>

      {/* Reading goal */}
      <Card title="Reading Goal">
        <p style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'#8b7170', margin:'0 0 12px' }}>
          How many books do you want to read this year?
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range" min={1} max={52} step={1}
            value={goal} onChange={e => setGoal(Number(e.target.value))}
            style={{ flex:1, accentColor:'#7b0d1e', height:4 }}
          />
          <span style={{
            fontFamily:'Playfair Display, Georgia, serif', fontSize:20, fontWeight:800,
            color:'#7b0d1e', minWidth:40, textAlign:'center',
          }}>{goal}</span>
          <span style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'#8b7170' }}>books</span>
        </div>
      </Card>

      <SaveButton saved={saved} saving={saving} onClick={handleSave} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   ReadingTab
   ───────────────────────────────────────────────────────────────────────────── */
function ReadingTab() {
  const {
    fontSize, lineHeight, fontFamily, theme,
    setFontSize, setLineHeight, setFontFamily, setTheme,
  } = useReaderStore();

  // Persist to localStorage so it loads on next reader open
  const [autoSave, setAutoSave] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iuea_reading_prefs') ?? '{}').autoSave ?? true; }
    catch { return true; }
  });

  useEffect(() => {
    const p = JSON.parse(localStorage.getItem('iuea_reading_prefs') ?? '{}');
    localStorage.setItem('iuea_reading_prefs', JSON.stringify({ ...p, autoSave }));
  }, [autoSave]);

  const FONTS = [
    { key: 'serif', label: 'Serif', sample: 'Playfair Display, Georgia, serif' },
    { key: 'sans',  label: 'Sans',  sample: 'Inter, system-ui, sans-serif' },
    { key: 'mono',  label: 'Mono',  sample: 'JetBrains Mono, monospace' },
  ];

  const THEMES = [
    { key: 'white', label: 'Light',  bg: '#ffffff', text: '#1a0609' },
    { key: 'sepia', label: 'Sepia',  bg: '#f8f0e0', text: '#3d2005' },
    { key: 'dark',  label: 'Dark',   bg: '#141010', text: '#e8d8d9' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Font family */}
      <Card title="Typeface">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {FONTS.map(({ key, label, sample }) => (
            <button key={key} onClick={() => setFontFamily(key)} style={{
              padding: '12px 8px', borderRadius: 12,
              border: `2px solid ${fontFamily === key ? '#7b0d1e' : 'rgba(223,191,190,0.4)'}`,
              background: fontFamily === key ? 'rgba(123,13,30,0.04)' : '#fff',
              cursor: 'pointer', textAlign: 'center',
              transition: 'border-color 0.18s ease',
            }}>
              <span style={{ display:'block', fontFamily:sample, fontSize:22, color: fontFamily === key ? '#7b0d1e' : '#1a0609', marginBottom:4 }}>Aa</span>
              <span style={{ fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600, color: fontFamily === key ? '#7b0d1e' : '#8b7170' }}>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Font size */}
      <Card title="Font Size">
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setFontSize(Math.max(12, fontSize-2))} style={iconBtn}>
            <span style={{ fontFamily:'serif', fontSize:13, fontWeight:700 }}>A</span>
          </button>
          <input
            type="range" min={12} max={32} step={2} value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))}
            style={{ flex:1, accentColor:'#7b0d1e' }}
          />
          <button onClick={() => setFontSize(Math.min(32, fontSize+2))} style={iconBtn}>
            <span style={{ fontFamily:'serif', fontSize:19, fontWeight:700 }}>A</span>
          </button>
          <span style={{ fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:700, color:'#7b0d1e', minWidth:34, textAlign:'right' }}>{fontSize}px</span>
        </div>
        <p style={{
          marginTop:12, padding:'12px 16px', borderRadius:10,
          background:'#fff8f7', border:'1px solid rgba(223,191,190,0.3)',
          fontFamily: fontFamily === 'mono' ? 'JetBrains Mono, monospace' : fontFamily === 'sans' ? 'Inter, system-ui' : 'Playfair Display, Georgia, serif',
          fontSize, color:'#1a0609', lineHeight: lineHeight,
        }}>The quick brown fox jumps over the lazy dog.</p>
      </Card>

      {/* Line spacing */}
      <Card title="Line Spacing">
        <div style={{ display:'flex', gap:8 }}>
          {[1.4, 1.6, 1.8, 2.0].map(v => (
            <button key={v} onClick={() => setLineHeight(v)} style={{
              flex:1, padding:'8px 0', borderRadius:10, border:'none', cursor:'pointer',
              background: lineHeight === v ? '#7b0d1e' : 'rgba(123,13,30,0.06)',
              color: lineHeight === v ? '#fff' : '#584141',
              fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600,
              transition:'background 0.18s ease, color 0.18s ease',
            }}>{v}×</button>
          ))}
        </div>
      </Card>

      {/* Theme */}
      <Card title="Reading Theme">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {THEMES.map(({ key, label, bg, text }) => (
            <button key={key} onClick={() => setTheme(key)} style={{
              padding:'16px 8px', borderRadius:12,
              background: bg,
              border: `2px solid ${theme === key ? '#7b0d1e' : 'rgba(0,0,0,0.08)'}`,
              boxShadow: theme === key ? '0 0 0 3px rgba(123,13,30,0.15)' : '0 1px 3px rgba(0,0,0,0.1)',
              cursor:'pointer', textAlign:'center',
              transition:'border-color 0.18s ease, box-shadow 0.18s ease',
            }}>
              <span style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:13, fontWeight:700, color:text }}>{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Toggles */}
      <Card title="Behaviour">
        <Toggle label="Auto-save position" sub="Resume where you left off" checked={autoSave} onChange={setAutoSave} />
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   LanguageTab
   ───────────────────────────────────────────────────────────────────────────── */
function LanguageTab() {
  const { user, updateUser } = useAuthStore();
  const load = () => { try { return JSON.parse(localStorage.getItem(LANG_PREF_KEY) ?? '{}'); } catch { return {}; } };
  const saved0 = load();

  const [primary,   setPrimary]   = useState(saved0.primary   ?? user?.language ?? 'en');
  const [autoTrans, setAutoTrans] = useState(saved0.autoTrans ?? false);
  const [ttsLang,   setTtsLang]   = useState(saved0.ttsLang   ?? 'en');
  const [aiLang,    setAiLang]    = useState(saved0.aiLang    ?? 'en');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  useEffect(() => {
    localStorage.setItem(LANG_PREF_KEY, JSON.stringify({ primary, autoTrans, ttsLang, aiLang }));
  }, [primary, autoTrans, ttsLang, aiLang]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/me', { language: primary });
      if (updateUser) updateUser(data.user ?? data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      <Card title="Primary Language">
        <p style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'#8b7170', margin:'0 0 10px' }}>
          Default language for the library interface
        </p>
        <Select value={primary} onChange={setPrimary} options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))} />
      </Card>

      <Card title="Reading & Translation">
        <Toggle label="Auto-translate descriptions" sub="Translate book summaries to your primary language" checked={autoTrans} onChange={setAutoTrans} />
        <div style={{ marginTop:16 }}>
          <p style={fieldLabel}>Text-to-Speech Language</p>
          <Select value={ttsLang} onChange={setTtsLang} options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))} />
          <p style={{ fontFamily:'Inter, sans-serif', fontSize:11, color:'#8b7170', marginTop:6 }}>
            Language used when reading text aloud in the reader
          </p>
        </div>
      </Card>

      <Card title="AI Assistant">
        <p style={fieldLabel}>Chatbot Reply Language</p>
        <Select value={aiLang} onChange={setAiLang} options={LANGUAGES.map(l => ({ value: l.code, label: l.name }))} />
        <p style={{ fontFamily:'Inter, sans-serif', fontSize:11, color:'#8b7170', marginTop:6 }}>
          The IUEA AI assistant will respond in this language
        </p>
      </Card>

      <SaveButton saved={saved} saving={saving} onClick={handleSave} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   NotificationsTab
   ───────────────────────────────────────────────────────────────────────────── */
function NotificationsTab() {
  const load = () => { try { return JSON.parse(localStorage.getItem(NOTIF_PREF_KEY) ?? '{}'); } catch { return {}; } };
  const saved0 = load();

  const [newBooks,    setNewBooks]    = useState(saved0.newBooks    ?? true);
  const [readRemind,  setReadRemind]  = useState(saved0.readRemind  ?? true);
  const [goalAlert,   setGoalAlert]   = useState(saved0.goalAlert   ?? true);
  const [newEpisodes, setNewEpisodes] = useState(saved0.newEpisodes ?? false);
  const [newsletter,  setNewsletter]  = useState(saved0.newsletter  ?? false);

  useEffect(() => {
    localStorage.setItem(NOTIF_PREF_KEY, JSON.stringify({ newBooks, readRemind, goalAlert, newEpisodes, newsletter }));
  }, [newBooks, readRemind, goalAlert, newEpisodes, newsletter]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      <Card title="Library Notifications">
        <Toggle label="New book arrivals"   sub="When new books are added to your faculty"  checked={newBooks}    onChange={setNewBooks} />
        <Toggle label="Reading reminders"   sub="Daily reminders to hit your reading goal"  checked={readRemind}  onChange={setReadRemind} />
        <Toggle label="Goal milestones"     sub="Celebrate when you hit reading milestones" checked={goalAlert}   onChange={setGoalAlert} />
      </Card>
      <Card title="Podcast Notifications">
        <Toggle label="New episodes"        sub="From podcasts in your library"              checked={newEpisodes} onChange={setNewEpisodes} />
      </Card>
      <Card title="General">
        <Toggle label="Newsletter"          sub="Monthly digest of top content"              checked={newsletter}  onChange={setNewsletter} />
      </Card>
      <div style={{
        padding:'12px 16px', borderRadius:12,
        background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.3)',
      }}>
        <p style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'#503d00', margin:0 }}>
          Preferences are saved automatically and applied to your next session.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AboutTab
   ───────────────────────────────────────────────────────────────────────────── */
function AboutTab() {
  const { user } = useAuthStore();
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      {/* App identity */}
      <div style={{
        background:'linear-gradient(135deg,#56000f,#7b0d1e)',
        borderRadius:20, padding:'2rem', textAlign:'center',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(201,168,76,0.15)' }} />
        <span className="material-symbols-outlined" style={{
          fontSize:48, color:'#c9a84c', fontVariationSettings:"'FILL' 1",
          display:'block', marginBottom:12,
        }}>local_library</span>
        <h2 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:24, fontWeight:800, color:'#fff', margin:'0 0 4px' }}>
          IUEA Library
        </h2>
        <p style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'rgba(255,209,212,0.7)', margin:0 }}>
          Digital Curator v1.0
        </p>
      </div>

      <Card title="Session">
        <InfoRow label="Signed in as"   value={user?.name ?? '—'} />
        <InfoRow label="Role"           value={user?.role ?? 'student'} capitalize />
        {user?.faculty && <InfoRow label="Faculty"  value={user.faculty} />}
        {user?.studentId && <InfoRow label="Student ID" value={user.studentId} />}
      </Card>

      <Card title="App Info">
        <InfoRow label="Version"    value="1.0.0" />
        <InfoRow label="Platform"   value="Web · React 18" />
        <InfoRow label="Library"    value="International University of East Africa" />
      </Card>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Shared micro-components
   ───────────────────────────────────────────────────────────────────────────── */
function Card({ title, children }) {
  return (
    <div style={{
      background:'#fff', borderRadius:16,
      boxShadow:'0 2px 8px rgba(86,0,15,0.07)',
      border:'1px solid rgba(223,191,190,0.3)',
      padding:'1.25rem 1.5rem',
      overflow:'hidden',
    }}>
      {title && (
        <p style={{
          fontFamily:'Inter, sans-serif', fontSize:10, fontWeight:700,
          letterSpacing:'0.12em', textTransform:'uppercase',
          color:'#7b0d1e', margin:'0 0 14px',
        }}>{title}</p>
      )}
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p style={fieldLabel}>{label}</p>
      {children}
    </div>
  );
}

function Toggle({ label, sub, checked, onChange }) {
  return (
    <label style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      gap:16, cursor:'pointer', padding:'10px 0',
      borderTop:'1px solid rgba(223,191,190,0.2)',
    }}
      onClick={() => onChange(!checked)}
    >
      <div>
        <p style={{ fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:600, color:'#1a0609', margin:0 }}>{label}</p>
        {sub && <p style={{ fontFamily:'Inter, sans-serif', fontSize:11, color:'#8b7170', margin:'2px 0 0' }}>{sub}</p>}
      </div>
      <div style={{
        width:44, height:24, borderRadius:99, flexShrink:0,
        background: checked ? '#7b0d1e' : '#dfbfbe',
        position:'relative', transition:'background 0.2s ease',
      }}>
        <div style={{
          position:'absolute', top:2, left: checked ? 22 : 2,
          width:20, height:20, borderRadius:'50%', background:'#fff',
          boxShadow:'0 1px 4px rgba(0,0,0,0.25)',
          transition:'left 0.2s ease',
        }} />
      </div>
    </label>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width:'100%', borderRadius:10, padding:'10px 14px',
        border:'1.5px solid rgba(223,191,190,0.5)',
        fontFamily:'Inter, sans-serif', fontSize:13, color:'#1a0609',
        background:'#fff', outline:'none', cursor:'pointer',
      }}
      onFocus={e => (e.target.style.borderColor = '#7b0d1e')}
      onBlur={e => (e.target.style.borderColor = 'rgba(223,191,190,0.5)')}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function SaveButton({ saved, saving, onClick }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      width:'100%', padding:'0.875rem', borderRadius:14, border:'none',
      background: saved ? '#16a34a' : '#7b0d1e',
      color:'#fff', fontFamily:'Inter, sans-serif', fontSize:13, fontWeight:700,
      cursor: saving ? 'wait' : 'pointer',
      transition:'background 0.2s ease',
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
    }}>
      {saved
        ? <><span className="material-symbols-outlined" style={{ fontSize:18 }}>check</span> Saved</>
        : saving ? 'Saving…' : 'Save Changes'
      }
    </button>
  );
}

function InfoRow({ label, value, capitalize }) {
  return (
    <div style={{
      display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'8px 0', borderTop:'1px solid rgba(223,191,190,0.2)',
    }}>
      <span style={{ fontFamily:'Inter, sans-serif', fontSize:12, color:'#8b7170' }}>{label}</span>
      <span style={{
        fontFamily:'Inter, sans-serif', fontSize:12, fontWeight:600, color:'#1a0609',
        textTransform: capitalize ? 'capitalize' : 'none',
      }}>{value}</span>
    </div>
  );
}

/* shared styles */
const fieldLabel = {
  fontFamily:'Inter, sans-serif', fontSize:11, fontWeight:600,
  color:'#584141', margin:'0 0 6px', display:'block',
};

const inputStyle = {
  width:'100%', borderRadius:10, padding:'10px 14px',
  border:'1.5px solid rgba(223,191,190,0.5)',
  fontFamily:'Inter, sans-serif', fontSize:13, color:'#1a0609',
  background:'#fff', outline:'none', boxSizing:'border-box',
};

const iconBtn = {
  width:34, height:34, borderRadius:'50%', border:'none',
  background:'rgba(123,13,30,0.08)', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
  color:'#1a0609',
};
