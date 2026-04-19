import { useState }                               from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore   from '../../store/authStore';
import { useLogout }  from '../../hooks/useAuth';
import MobileBottomNav from './MobileBottomNav';
import ChatbotOverlay  from '../chatbot/ChatbotOverlay';

const NAV_ITEMS = [
  { to: '/home',           end: true,  icon: 'dashboard',            label: 'Dashboard'  },
  { to: '/home/search',    end: false, icon: 'library_books',        label: 'Books'      },
  { to: '/home/podcasts',  end: false, icon: 'podcasts',             label: 'Podcasts'   },
  { to: '/admin/users',    end: false, icon: 'group',                label: 'Users'      },
  { to: '/admin',          end: true,  icon: 'admin_panel_settings', label: 'Admin'      },
  { to: '/home/settings',  end: false, icon: 'tune',                 label: 'Settings'   },
];

export default function DashboardLayout() {
  const { user }   = useAuthStore();
  const logout     = useLogout();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [search, setSearch]       = useState('');
  const [chatOpen, setChatOpen]   = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/home/search?q=${encodeURIComponent(search.trim())}`);
  };

  const isActive = (to, end) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  const allNavItems = NAV_ITEMS;

  // Pages that render their own topbar — hide the layout topbar on these routes
  const CUSTOM_TOPBAR = ['/home/search', '/home/podcasts', '/home/library', '/home/books/'];
  const showLayoutTopbar = !CUSTOM_TOPBAR.some(p => location.pathname.startsWith(p)) && location.pathname === '/home';

  return (
    <>
      <style>{`
        .dl-sidebar {
          width: 240px;
          height: 100vh;
          position: sticky;
          left: 0;
          top: 0;
          background: #5C0F1F;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
          box-shadow: 4px 0 20px rgba(60,10,18,0.25);
          z-index: 50;
          flex-shrink: 0;
        }
        @media (max-width: 767px) {
          .dl-sidebar { display: none; }
          .dl-topbar  { display: none; }
        }
        .dl-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          margin: 0 0.5rem;
          border-radius: 10px;
          font-family: Inter, sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-decoration: none;
          transition: all 0.15s;
          cursor: pointer;
        }
        .dl-nav-item-active {
          background: #8A1228;
          color: #ffffff;
        }
        .dl-nav-item-inactive {
          color: rgba(248,215,211,0.65);
        }
        .dl-nav-item-inactive:hover {
          color: #ffffff;
          background: rgba(138,18,40,0.4);
        }
        .dl-topbar {
          position: sticky;
          top: 0;
          width: 100%;
          z-index: 40;
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
          background: #FCE8E6;
          border-bottom: 1px solid #EBD2CF;
          flex-shrink: 0;
        }
        .dl-fab {
          position: fixed;
          bottom: 28px;
          right: 28px;
          width: 56px;
          height: 56px;
          border-radius: 999px;
          background: #8A1228;
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(138,18,40,0.4);
          z-index: 40;
          transition: background 0.15s, transform 0.15s, box-shadow 0.15s;
        }
        .dl-fab:hover {
          background: #5C0F1F;
          transform: scale(1.06);
          box-shadow: 0 6px 24px rgba(138,18,40,0.5);
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#FCE8E6' }}>

        {/* ── SIDEBAR ── */}
        <aside className="dl-sidebar">

          {/* Logo */}
          <div style={{ padding: '0 1.5rem', marginBottom: '2.5rem' }}>
            <img src="/iuea_logo.png" alt="IUEA Logo"
              style={{ height: 48, width: 'auto', objectFit: 'contain' }} />
            <p style={{
              color: 'rgba(248,215,211,0.45)', fontSize: '10px',
              fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
              letterSpacing: '0.15em', marginTop: 4,
            }}>
              Admin Console
            </p>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {allNavItems.map(({ to, end, icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`dl-nav-item ${isActive(to, end) ? 'dl-nav-item-active' : 'dl-nav-item-inactive'}`}
              >
                <span className="material-symbols-outlined"
                  style={{ color: isActive(to, end) ? '#D9B96B' : undefined }}>
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* User card + logout */}
          <div style={{ marginTop: 'auto', padding: '0 0.5rem' }}>
            <div style={{
              background: 'rgba(138,18,40,0.25)', borderRadius: '10px',
              padding: '1rem', marginBottom: '1rem', marginLeft: '0.5rem', marginRight: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(185,150,74,0.25)', border: '2px solid rgba(185,150,74,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {user?.name ? user.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() : '?'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{
                    color: '#fff', fontSize: '0.875rem', fontWeight: 600,
                    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {user?.name?.split(' ').slice(0,2).join(' ') ?? 'User'}
                  </p>
                  <p style={{
                    color: 'rgba(255,209,212,0.5)', fontSize: '10px',
                    fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {user?.role ?? 'Student'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="dl-nav-item dl-nav-item-inactive"
              style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#FCE8E6' }}>

          {/* Top bar — hidden on pages that have their own topbar */}
          {showLayoutTopbar && <header className="dl-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img src="/iuea_logo.png" alt="IUEA Logo"
                style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <form onSubmit={handleSearch} style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#584141', fontSize: '1rem', pointerEvents: 'none',
                }}>search</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search the archives..."
                  style={{
                    background: '#ffffff', border: 'none', borderRadius: 9999,
                    padding: '0.5rem 1rem 0.5rem 2.5rem', fontSize: '0.875rem',
                    width: 280, fontFamily: 'Inter, sans-serif', outline: 'none',
                  }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(123,13,30,0.2)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(138,18,40,0.55)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#8A1228')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(138,18,40,0.55)')}>
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                <button
                  onClick={() => navigate('/home/profile')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(138,18,40,0.55)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#8A1228')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(138,18,40,0.55)')}>
                  <span className="material-symbols-outlined">account_circle</span>
                </button>
              </div>
            </div>
          </header>}

          {/* Page content */}
          <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 64 }}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile bottom nav (hidden on desktop via CSS) */}
      <MobileBottomNav />

      {/* ── Gemini Chatbot FAB ── */}
      {!chatOpen && (
        <button
          className="dl-fab"
          onClick={() => setChatOpen(true)}
          title="Ask IUEA AI Assistant"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 26 }}>smart_toy</span>
        </button>
      )}

      {/* ── Chatbot overlay (slides in from bottom-right) ── */}
      {chatOpen && (
        <ChatbotOverlay bookId={null} onClose={() => setChatOpen(false)} />
      )}
    </>
  );
}
