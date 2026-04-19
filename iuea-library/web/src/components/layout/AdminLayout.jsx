import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';

const NAV = [
  { to: '/admin',           end: true,  icon: 'dashboard', label: 'Dashboard'  },
  { to: '/admin/books',     end: false, icon: 'book',      label: 'Books'      },
  { to: '/admin/users',     end: false, icon: 'group',     label: 'Users'      },
  { to: '/admin/analytics', end: false, icon: 'analytics', label: 'Analytics'  },
];

export default function AdminLayout() {
  const { user }    = useAuthStore();
  const logout      = useLogout();
  const location    = useLocation();

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;

  const isActive = (to, end) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  // Pages that render their own topbar — hide the layout topbar on these routes
  const CUSTOM_TOPBAR = ['/admin/books', '/admin/users', '/admin/analytics'];
  const showLayoutTopbar = !CUSTOM_TOPBAR.some(p => location.pathname.startsWith(p));

  return (
    <>
      <style>{`
        .al-sidebar {
          width: 240px; height: 100vh;
          position: sticky; left: 0; top: 0;
          background: #56000f;
          display: flex; flex-direction: column;
          padding: 1.5rem 0;
          box-shadow: 4px 0 20px rgba(0,0,0,0.15);
          z-index: 50; flex-shrink: 0;
        }
        .al-nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 1rem; margin: 0 0.5rem;
          border-radius: 0.5rem;
          font-family: Inter, sans-serif; font-size: 0.875rem;
          letter-spacing: 0.025em; text-decoration: none;
          transition: all 0.15s; cursor: pointer;
        }
        .al-nav-active   { background: #7b0d1e; color: #ffffff; }
        .al-nav-inactive { color: rgba(255,209,212,0.7); }
        .al-nav-inactive:hover { color: #ffffff; background: rgba(123,13,30,0.5); }
        .al-topbar {
          position: sticky; top: 0; width: 100%; z-index: 40;
          height: 64px; background: #fff0f0;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 2rem; flex-shrink: 0;
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: '#fff0f0' }}>

        {/* ── Sidebar ── */}
        <aside className="al-sidebar">
          {/* Logo / Title */}
          <div style={{ padding: '0 1.5rem', marginBottom: '2.5rem' }}>
            <h1 style={{ fontFamily: 'Newsreader, serif', fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
              IUEA Library
            </h1>
            <p style={{ color: 'rgba(255,209,212,0.6)', fontSize: '10px', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', marginTop: 4 }}>
              Digital Curator
            </p>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(({ to, end, icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`al-nav-item ${isActive(to, end) ? 'al-nav-active' : 'al-nav-inactive'}`}
              >
                <span className="material-symbols-outlined"
                  style={{ color: isActive(to, end) ? '#c9a84c' : undefined, fontVariationSettings: isActive(to, end) ? "'FILL' 1" : "'FILL' 0" }}>
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div style={{ marginTop: 'auto', padding: '0 0.5rem' }}>
            <button
              onClick={logout}
              className="al-nav-item al-nav-inactive"
              style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="material-symbols-outlined">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Topbar */}
          {showLayoutTopbar && <header className="al-topbar">
            <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '1.5rem', fontWeight: 700, color: '#56000f', margin: 0 }}>
              Curator Overview
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#584141', fontSize: '1rem', pointerEvents: 'none' }}>search</span>
                <input
                  placeholder="Search archive..."
                  style={{ background: '#ffffff', border: 'none', borderRadius: 9999, padding: '0.4rem 1rem 0.4rem 2.25rem', fontSize: '0.875rem', width: 256, fontFamily: 'Inter, sans-serif', outline: 'none' }}
                  onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(123,13,30,0.2)')}
                  onBlur={e => (e.target.style.boxShadow = 'none')}
                />
              </div>
              <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(86,0,15,0.8)' }}>
                <span className="material-symbols-outlined">notifications</span>
                <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#ba1a1a', borderRadius: '50%', border: '2px solid #fff0f0' }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(223,191,190,0.4)' }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ8vqOQnf-CN_qcVkEFzv8vMVhvF3HKZcBrmn_xiRiOgLv6xvEoxeGGoivXChdRWA4Al1fJDVndJRgeLcp6-u-2UkScPI5hH5dmbk-bBWTKA9M1Qre_Ek0bSz2NbEgmc6ZQGMGCeDvtq9j9XJADWEvOOH-vL8jlSvucQDznNDYGdtDiECD7EMm3YcvdBOz7v-4fyAYBzI6u5w5WiuEb2-by2jokGOOTLtnL7uNXdVK_5C6pLlquN67KH4JvFmSIH_Nii5lQMxc3Ec"
                  alt="Admin"
                  style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                />
                <span className="material-symbols-outlined" style={{ color: '#56000f' }}>account_circle</span>
              </div>
            </div>
          </header>}

          <main style={{ flex: 1, overflowY: 'auto' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
