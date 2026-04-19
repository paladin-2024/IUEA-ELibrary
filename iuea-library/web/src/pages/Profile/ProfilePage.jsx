import { useState, useEffect }    from 'react';
import { useNavigate }            from 'react-router-dom';
import { useLogout }              from '../../hooks/useAuth';
import useAuthStore               from '../../store/authStore';
import api                        from '../../services/api';

/* ─────────────────────────────────────────────────────────────────────────────
   ProfilePage — premium redesign
   ───────────────────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user }   = useAuthStore();
  const logout     = useLogout();
  const navigate   = useNavigate();
  const [stats, setStats] = useState({ booksRead: 0, hoursRead: 0, streak: 0, goalPct: 0 });

  useEffect(() => {
    api.get('/progress').then(({ data }) => {
      const list     = data.progress ?? [];
      const finished = list.filter(p => p.isCompleted).length;
      const hours    = list.reduce((s, p) => s + (p.totalReadingMinutes ?? 0), 0) / 60;
      const goal     = user?.readingGoal ?? 12;
      setStats({
        booksRead: finished,
        hoursRead: Math.round(hours * 10) / 10,
        streak:    user?.streak ?? 0,
        goalPct:   Math.min(Math.round((finished / goal) * 100), 100),
      });
    }).catch(() => {});
  }, []);

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  const QUICK_LINKS = [
    { icon: 'library_books',  label: 'My Library',  to: '/home/library',              bg: '#5C0F1F' },
    { icon: 'download',       label: 'Downloads',   to: '/home/library/downloads',     bg: '#8A1228' },
    { icon: 'bookmark',       label: 'Bookmarks',   to: '/home/library/highlights',    bg: '#B8964A' },
    { icon: 'history',        label: 'History',     to: '/home/library',              bg: '#984447' },
  ];

  const SETTINGS_ROWS = [
    { icon: 'tune',       label: 'Appearance & Reading',  sub: 'Font, theme, display',         to: '/home/settings'                           },
    { icon: 'translate',  label: 'Language',              sub: 'Translation & TTS',            to: '/home/settings?tab=language'              },
    { icon: 'notifications', label: 'Notifications',      sub: 'Alerts & reminders',           to: '/home/settings?tab=notifications'         },
    { icon: 'info',       label: 'About',                 sub: 'Version 1.0 · IUEA Library',   to: '/home/settings?tab=about'                 },
  ];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{
        borderRadius: 24,
        background: 'linear-gradient(135deg, #8A1228 0%, #5C0F1F 50%, #3d0009 100%)',
        padding: '2rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(201,168,76,0.12)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -20,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #B8964A, #e6c96a)',
            border: '3px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            overflow: 'hidden',
          }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: 28, fontWeight: 800, color: '#3d2900',
                }}>{initials}</span>
            }
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 22, fontWeight: 800, color: '#fff',
              margin: '0 0 4px', lineHeight: 1.2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{user?.name ?? '—'}</h1>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 12, color: 'rgba(255,209,212,0.8)',
              margin: '0 0 10px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{user?.email}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {user?.studentId && (
                <Pill label={user.studentId} light />
              )}
              {user?.faculty && (
                <Pill label={user.faculty} gold />
              )}
              <Pill label={user?.role ?? 'Student'} light />
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => navigate('/home/settings')}
            style={{
              position: 'absolute', top: 0, right: 0,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10, color: '#fff', cursor: 'pointer',
              padding: '6px 14px',
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
              backdropFilter: 'blur(8px)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
            Edit
          </button>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        {[
          { label: 'Books Read',  value: stats.booksRead, icon: 'menu_book'  },
          { label: 'Hours Read',  value: stats.hoursRead, icon: 'schedule'   },
          { label: 'Day Streak',  value: stats.streak,    icon: 'local_fire_department' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background: '#fff', borderRadius: 16,
            padding: '1rem', textAlign: 'center',
            boxShadow: '0 2px 8px rgba(138,18,40,0.07)',
            border: '1px solid rgba(223,191,190,0.3)',
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 20, color: '#B8964A',
              fontVariationSettings: "'FILL' 1", display: 'block', marginBottom: 4,
            }}>{icon}</span>
            <p style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: 24, fontWeight: 800, color: '#5C0F1F', margin: 0, lineHeight: 1,
            }}>{value}</p>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 10, color: '#A89597', marginTop: 4, fontWeight: 500,
            }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Annual reading goal ────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '1.25rem 1.5rem',
        boxShadow: '0 2px 8px rgba(138,18,40,0.07)',
        border: '1px solid rgba(223,191,190,0.3)',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#1a0609', margin: 0 }}>
              Annual Reading Goal
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A89597', margin: '2px 0 0' }}>
              {stats.booksRead} of {user?.readingGoal ?? 12} books completed
            </p>
          </div>
          <span style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 22, fontWeight: 800, color: '#5C0F1F',
          }}>{stats.goalPct}%</span>
        </div>
        <div style={{ height: 8, background: '#ffd9dc', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${stats.goalPct}%`,
            background: 'linear-gradient(90deg, #5C0F1F, #B8964A)',
            borderRadius: 99,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* ── Quick access ───────────────────────────────────────────────────── */}
      <p style={sectionLabel}>Quick Access</p>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        {QUICK_LINKS.map(({ icon, label, to, bg }) => (
          <button key={label} onClick={() => navigate(to)} style={{
            background: '#fff',
            border: '1px solid rgba(223,191,190,0.3)',
            borderRadius: 14, padding: '1rem 0.5rem',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 8,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(138,18,40,0.06)',
            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(138,18,40,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(138,18,40,0.06)'; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 20, color: '#fff', fontVariationSettings: "'FILL' 1",
              }}>{icon}</span>
            </div>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 600,
              color: '#1a0609', textAlign: 'center', lineHeight: 1.3,
            }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Settings list ──────────────────────────────────────────────────── */}
      <p style={sectionLabel}>Settings</p>
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 2px 8px rgba(138,18,40,0.07)',
        border: '1px solid rgba(223,191,190,0.3)',
        overflow: 'hidden',
        marginBottom: '1.5rem',
      }}>
        {SETTINGS_ROWS.map(({ icon, label, sub, to }, i) => (
          <button key={label} onClick={() => navigate(to)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem 1.25rem', background: 'none', border: 'none',
            borderTop: i > 0 ? '1px solid rgba(223,191,190,0.2)' : 'none',
            cursor: 'pointer', textAlign: 'left',
            transition: 'background 0.15s ease',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FCE8E6')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(107,15,26,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#5C0F1F' }}>{icon}</span>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600, color: '#1a0609', margin: 0 }}>{label}</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A89597', margin: '2px 0 0' }}>{sub}</p>
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#EBD2CF' }}>chevron_right</span>
          </button>
        ))}
      </div>

      {/* ── Sign out ───────────────────────────────────────────────────────── */}
      <button onClick={logout} style={{
        width: '100%', padding: '0.875rem', borderRadius: 14,
        border: '1.5px solid rgba(220,38,38,0.3)',
        background: 'rgba(220,38,38,0.04)',
        color: '#dc2626',
        fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        transition: 'background 0.15s ease',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.09)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.04)')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
        Sign Out
      </button>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function Pill({ label, light, gold }) {
  return (
    <span style={{
      fontFamily: 'Inter, sans-serif',
      fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase',
      padding: '3px 9px', borderRadius: 99,
      background: gold
        ? 'rgba(201,168,76,0.85)'
        : 'rgba(255,255,255,0.15)',
      color: gold ? '#3d2900' : 'rgba(255,255,255,0.9)',
      border: gold ? 'none' : '1px solid rgba(255,255,255,0.2)',
    }}>{label}</span>
  );
}

const sectionLabel = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
  textTransform: 'uppercase', color: '#A89597',
  marginBottom: '0.75rem', display: 'block',
};
