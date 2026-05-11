import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import api from '../../services/api';

const NAV_MENU = [
  { to: '/admin',           end: true,  icon: 'grid_view',     label: 'Dashboard'  },
  { to: '/admin/books',     end: false, icon: 'menu_book',     label: 'Books'      },
  { to: '/admin/users',     end: false, icon: 'group',         label: 'Users'      },
  { to: '/admin/loans',     end: false, icon: 'local_library', label: 'Loans'      },
  { to: '/admin/analytics', end: false, icon: 'bar_chart',     label: 'Analytics'  },
  { to: '/admin/podcasts',  end: false, icon: 'podcasts',      label: 'Podcasts'   },
];
const NAV_SETTINGS = [
  { to: '/admin/settings',  end: false, icon: 'settings',      label: 'Settings'   },
];

const PAGE_TITLES = {
  '/admin':           'Dashboard',
  '/admin/books':     'Books',
  '/admin/users':     'Users',
  '/admin/loans':     'Loans',
  '/admin/analytics': 'Analytics',
  '/admin/podcasts':  'Podcasts',
  '/admin/settings':  'Settings',
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AdminLayout() {
  const { user }       = useAuthStore();
  const logout         = useLogout();
  const location       = useLocation();
  const [collapsed,   setCollapsed]   = useState(false);
  const [rsCollapsed, setRsCollapsed] = useState(false);
  const [rsData,      setRsData]      = useState(null);
  const [loanStats,   setLoanStats]   = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/borrowing/stats'),
    ]).then(([s, l]) => {
      setRsData(s.data);
      setLoanStats(l.data?.stats);
    }).catch(() => {});
  }, []);

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;

  const isActive = (to, end) =>
    end ? location.pathname === to : location.pathname.startsWith(to);

  const pageTitle = Object.entries(PAGE_TITLES)
    .reverse()
    .find(([p]) => location.pathname.startsWith(p))?.[1] ?? 'Admin';

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : 'A';

  const W  = collapsed   ? 64  : 220;
  const RS = rsCollapsed ? 0   : 272;

  const stats      = rsData?.stats ?? {};
  const recentUsers = (rsData?.recentUsers ?? []).slice(0, 5);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .al-root { display: flex; height: 100vh; overflow: hidden; background: #F8FAFC; font-family: 'Inter', sans-serif; }

        /* ── Left Sidebar ── */
        .al-sidebar {
          width: ${W}px; height: 100%;
          background: #120508;
          display: flex; flex-direction: column;
          flex-shrink: 0; z-index: 50;
          transition: width 0.2s ease;
          overflow: hidden;
        }

        .al-logo-block {
          display: flex; align-items: center; justify-content: space-between;
          padding: ${collapsed ? '1.25rem 0' : '1.25rem 1rem 1rem'};
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
          ${collapsed ? 'justify-content: center;' : ''}
        }
        .al-logo-inner { display: flex; align-items: center; gap: 0.625rem; overflow: hidden; }
        .al-logo-dot {
          width: 28px; height: 28px; border-radius: 8px;
          background: linear-gradient(135deg, #E11D48, #FB7185);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .al-logo-dot .material-symbols-outlined { font-size: 1rem; color: #fff; font-variation-settings: "'FILL' 1"; }
        .al-logo-text { overflow: hidden; }
        .al-logo-name { font-size: 0.875rem; font-weight: 700; color: #fff; letter-spacing: -0.01em; white-space: nowrap; }
        .al-logo-sub  { font-size: 9px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.18em; margin-top: 1px; white-space: nowrap; }

        .al-collapse-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.3); padding: 4px;
          border-radius: 6px; display: flex; align-items: center;
          flex-shrink: 0; transition: color 0.12s;
        }
        .al-collapse-btn:hover { color: rgba(255,255,255,0.7); }
        .al-collapse-btn .material-symbols-outlined { font-size: 1rem; }

        /* Nav */
        .al-nav { flex: 1; display: flex; flex-direction: column; padding: 0.75rem ${collapsed ? '0.5rem' : '0.75rem'}; gap: 1px; overflow-y: auto; overflow-x: hidden; }
        .al-section-label {
          font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.2);
          text-transform: uppercase; letter-spacing: 0.18em;
          padding: ${collapsed ? '0.75rem 0 0.25rem' : '0.75rem 0.5rem 0.25rem'};
          white-space: nowrap; overflow: hidden;
          ${collapsed ? 'text-align: center; font-size: 6px; padding-left: 0; letter-spacing: 0.05em;' : ''}
        }
        .al-nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: ${collapsed ? '0.625rem 0' : '0.625rem 0.75rem'};
          ${collapsed ? 'justify-content: center;' : ''}
          border-radius: 8px;
          font-size: 0.8125rem; font-weight: 500;
          text-decoration: none; cursor: pointer; border: none;
          transition: background 0.12s, color 0.12s;
          white-space: nowrap; overflow: hidden;
          position: relative;
        }
        .al-nav-item .material-symbols-outlined { font-size: 1.125rem; flex-shrink: 0; }
        .al-nav-item span.label { ${collapsed ? 'display: none;' : ''} }

        .al-nav-active  { background: #E11D48; color: #fff; }
        .al-nav-active .material-symbols-outlined { font-variation-settings: "'FILL' 1"; color: #FFD6DC; }
        .al-nav-inactive { color: rgba(255,255,255,0.4); background: none; }
        .al-nav-inactive:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.06); }

        .al-nav-badge {
          font-size: 9px; font-weight: 700; background: #16a34a; color: #fff;
          padding: 1px 5px; border-radius: 999px; letter-spacing: 0.05em;
          flex-shrink: 0; ${collapsed ? 'display: none;' : ''}
        }

        /* Tooltip on collapsed */
        .al-nav-item[data-tooltip]:hover::after {
          content: attr(data-tooltip);
          position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%);
          background: #1e293b; color: #fff; font-size: 0.75rem; font-weight: 500;
          padding: 4px 10px; border-radius: 6px; white-space: nowrap;
          pointer-events: none; z-index: 100;
          ${collapsed ? '' : 'display: none;'}
        }

        /* Bottom */
        .al-bottom { padding: ${collapsed ? '0.75rem 0.5rem' : '0.75rem'}; border-top: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
        .al-user-row {
          display: flex; align-items: center; gap: 0.5rem;
          padding: ${collapsed ? '0.5rem 0' : '0.5rem 0.375rem'};
          ${collapsed ? 'justify-content: center;' : ''}
          border-radius: 8px; cursor: pointer; transition: background 0.12s;
        }
        .al-user-row:hover { background: rgba(255,255,255,0.05); }
        .al-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: #E11D48;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
          overflow: hidden;
        }
        .al-user-info { overflow: hidden; ${collapsed ? 'display: none;' : ''} }
        .al-user-name { font-size: 0.75rem; font-weight: 600; color: rgba(255,255,255,0.8); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .al-user-role { font-size: 10px; color: rgba(255,255,255,0.3); }

        /* ── Main ── */
        .al-main { flex: 1; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; }

        .al-topbar {
          position: sticky; top: 0; z-index: 40;
          height: 52px; background: #fff;
          border-bottom: 1px solid #E2E8F0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 1.5rem; flex-shrink: 0;
        }
        .al-topbar-left { display: flex; align-items: center; gap: 0.75rem; }
        .al-breadcrumb { font-size: 0.875rem; font-weight: 600; color: #0F172A; }
        .al-search-wrap { position: relative; }
        .al-search-wrap input {
          background: #F1F5F9; border: none; outline: none;
          border-radius: 8px; padding: 0.375rem 0.875rem 0.375rem 2rem;
          font-size: 0.8125rem; color: #334155; width: 220px;
          font-family: 'Inter', sans-serif; transition: box-shadow 0.15s, background 0.15s;
        }
        .al-search-wrap input::placeholder { color: #94A3B8; }
        .al-search-wrap input:focus { box-shadow: 0 0 0 2px rgba(225,29,72,0.2); background: #fff; }
        .al-search-wrap .material-symbols-outlined {
          position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%);
          font-size: 0.9rem; color: #94A3B8; pointer-events: none;
        }
        .al-topbar-right { display: flex; align-items: center; gap: 0.625rem; }
        .al-icon-btn {
          position: relative; background: none; border: none; cursor: pointer;
          padding: 6px; color: #64748B; border-radius: 8px;
          transition: background 0.12s; display: flex; align-items: center;
        }
        .al-icon-btn:hover { background: #F1F5F9; color: #0F172A; }
        .al-icon-btn .material-symbols-outlined { font-size: 1.125rem; }
        .al-notif-dot { position: absolute; top: 4px; right: 4px; width: 7px; height: 7px; background: #E11D48; border-radius: 50%; border: 2px solid #fff; }

        .al-run-ai-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 0.375rem 0.875rem; border-radius: 8px; border: none;
          background: linear-gradient(135deg, #E11D48, #FB923C);
          color: #fff; font-size: 0.8125rem; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: opacity 0.15s; white-space: nowrap;
        }
        .al-run-ai-btn:hover { opacity: 0.88; }
        .al-run-ai-btn .material-symbols-outlined { font-size: 0.9rem; }

        .al-divider { width: 1px; height: 18px; background: #E2E8F0; }

        .al-topbar-user {
          display: flex; align-items: center; gap: 0.375rem;
          cursor: pointer; padding: 4px 6px; border-radius: 8px; transition: background 0.12s;
        }
        .al-topbar-user:hover { background: #F1F5F9; }
        .al-topbar-user-name { font-size: 0.8125rem; font-weight: 500; color: #374151; }

        /* ── Body row (content + right sidebar) ── */
        .al-body { flex: 1; display: flex; overflow: hidden; min-height: 0; }
        .al-content { flex: 1; overflow-y: auto; min-width: 0; }

        /* ── Right Sidebar ── */
        .al-rsidebar {
          width: ${RS}px; height: 100%;
          background: #fff;
          border-left: 1px solid #E2E8F0;
          display: flex; flex-direction: column;
          flex-shrink: 0; overflow-y: auto;
          transition: width 0.2s ease;
        }

        .al-rs-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1rem 0.75rem;
          border-bottom: 1px solid #F1F5F9;
          flex-shrink: 0;
        }
        .al-rs-title {
          font-size: 0.75rem; font-weight: 700; color: #0F172A;
          text-transform: uppercase; letter-spacing: 0.1em;
        }
        .al-rs-close {
          background: none; border: none; cursor: pointer;
          color: #94A3B8; padding: 2px; border-radius: 4px;
          display: flex; align-items: center; transition: color 0.12s;
        }
        .al-rs-close:hover { color: #475569; }
        .al-rs-close .material-symbols-outlined { font-size: 1rem; }

        .al-rs-section { padding: 1rem; border-bottom: 1px solid #F1F5F9; }
        .al-rs-section-label {
          font-size: 9px; font-weight: 700; color: #94A3B8;
          text-transform: uppercase; letter-spacing: 0.15em;
          margin-bottom: 0.625rem;
        }

        /* Stats grid */
        .al-rs-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .al-rs-stat {
          background: #F8FAFC; border-radius: 8px;
          padding: 0.625rem 0.75rem;
          border: 1px solid #E2E8F0;
        }
        .al-rs-stat-val { font-size: 1.125rem; font-weight: 700; color: #0F172A; line-height: 1; }
        .al-rs-stat-lbl { font-size: 10px; color: #94A3B8; margin-top: 3px; }

        /* Alert pills */
        .al-rs-alerts { display: flex; flex-direction: column; gap: 0.5rem; }
        .al-rs-alert {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.5rem 0.75rem; border-radius: 8px;
          font-size: 0.8125rem;
        }
        .al-rs-alert-pending  { background: #FFFBEB; border: 1px solid #FDE68A; }
        .al-rs-alert-overdue  { background: #FFF1F2; border: 1px solid #FECDD3; }
        .al-rs-alert-active   { background: #F0FDF4; border: 1px solid #BBF7D0; }
        .al-rs-alert-icon     { font-size: 1rem; flex-shrink: 0; }
        .al-rs-alert-body     { flex: 1; }
        .al-rs-alert-label    { font-size: 0.75rem; font-weight: 600; color: #0F172A; }
        .al-rs-alert-sub      { font-size: 10px; color: #64748B; }
        .al-rs-alert-count    { font-size: 1rem; font-weight: 700; }
        .al-rs-alert-pending .al-rs-alert-count { color: #D97706; }
        .al-rs-alert-overdue .al-rs-alert-count { color: #E11D48; }
        .al-rs-alert-active  .al-rs-alert-count { color: #16A34A; }

        /* Recent users */
        .al-rs-users { display: flex; flex-direction: column; gap: 0.5rem; }
        .al-rs-user  { display: flex; align-items: center; gap: 0.625rem; }
        .al-rs-user-av {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg, #E11D48, #FB923C);
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .al-rs-user-name { font-size: 0.75rem; font-weight: 600; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .al-rs-user-meta { font-size: 10px; color: #94A3B8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .al-rs-user-time { font-size: 10px; color: #94A3B8; flex-shrink: 0; margin-left: auto; }

        /* System status */
        .al-rs-sys { display: flex; flex-direction: column; gap: 0.5rem; }
        .al-rs-sys-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.375rem 0;
        }
        .al-rs-sys-name { font-size: 0.75rem; color: #475569; }
        .al-rs-sys-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 600; color: #16A34A;
        }
        .al-rs-sys-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #16A34A;
          animation: al-pulse 2s ease-in-out infinite;
        }
        @keyframes al-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        /* Skeleton shimmer */
        .al-rs-skel {
          height: 14px; border-radius: 4px;
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: al-shimmer 1.4s ease-in-out infinite;
        }
        @keyframes al-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <div className="al-root">
        {/* ── Left Sidebar ── */}
        <aside className="al-sidebar">
          {/* Logo */}
          <div className="al-logo-block">
            <div className="al-logo-inner">
              <div className="al-logo-dot">
                <span className="material-symbols-outlined">auto_stories</span>
              </div>
              {!collapsed && (
                <div className="al-logo-text">
                  <div className="al-logo-name">IUEA Library</div>
                  <div className="al-logo-sub">Admin Console</div>
                </div>
              )}
            </div>
            {!collapsed && (
              <button className="al-collapse-btn" onClick={() => setCollapsed(true)} title="Collapse sidebar">
                <span className="material-symbols-outlined">keyboard_double_arrow_left</span>
              </button>
            )}
          </div>

          {/* Nav */}
          <nav className="al-nav">
            {collapsed ? (
              <button className="al-collapse-btn" onClick={() => setCollapsed(false)} title="Expand sidebar" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined">keyboard_double_arrow_right</span>
              </button>
            ) : null}

            <span className="al-section-label">{collapsed ? '···' : 'Menu'}</span>
            {NAV_MENU.map(({ to, end, icon, label }) => (
              <Link
                key={to} to={to}
                data-tooltip={collapsed ? label : undefined}
                className={`al-nav-item ${isActive(to, end) ? 'al-nav-active' : 'al-nav-inactive'}`}
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="label">{label}</span>
                {label === 'Podcasts' && !collapsed && <span className="al-nav-badge">LIVE</span>}
              </Link>
            ))}

            <span className="al-section-label" style={{ marginTop: '0.5rem' }}>{collapsed ? '···' : 'Settings'}</span>
            {NAV_SETTINGS.map(({ to, end, icon, label }) => (
              <Link
                key={to} to={to}
                data-tooltip={collapsed ? label : undefined}
                className={`al-nav-item ${isActive(to, end) ? 'al-nav-active' : 'al-nav-inactive'}`}
              >
                <span className="material-symbols-outlined">{icon}</span>
                <span className="label">{label}</span>
              </Link>
            ))}
            <button
              onClick={logout}
              data-tooltip={collapsed ? 'Logout' : undefined}
              className="al-nav-item al-nav-inactive"
              style={{ width: '100%', textAlign: 'left', background: 'none' }}
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="label">Logout</span>
            </button>
          </nav>

          {/* User */}
          <div className="al-bottom">
            <div className="al-user-row">
              <div className="al-avatar">
                {user?.avatar
                  ? <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials
                }
              </div>
              <div className="al-user-info">
                <div className="al-user-name">{user?.name ?? 'Admin'}</div>
                <div className="al-user-role">Administrator</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="al-main">
          <header className="al-topbar">
            <div className="al-topbar-left">
              <span className="al-breadcrumb">{pageTitle}</span>
              <div className="al-search-wrap">
                <span className="material-symbols-outlined">search</span>
                <input placeholder="Search…" />
              </div>
            </div>
            <div className="al-topbar-right">
              <button className="al-run-ai-btn">
                <span className="material-symbols-outlined">auto_awesome</span>
                Run AI
              </button>
              <button className="al-icon-btn">
                <span className="material-symbols-outlined">refresh</span>
              </button>
              <div className="al-divider" />
              <button className="al-icon-btn">
                <span className="material-symbols-outlined">notifications</span>
                <span className="al-notif-dot" />
              </button>
              {/* Right sidebar toggle */}
              <button
                className="al-icon-btn"
                onClick={() => setRsCollapsed(v => !v)}
                title={rsCollapsed ? 'Show panel' : 'Hide panel'}
                style={{ color: rsCollapsed ? '#94A3B8' : '#E11D48' }}
              >
                <span className="material-symbols-outlined">
                  {rsCollapsed ? 'dock_to_right' : 'dock_to_right'}
                </span>
              </button>
              <div className="al-topbar-user">
                <div className="al-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>
                  {user?.avatar
                    ? <img src={user.avatar} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials
                  }
                </div>
                <span className="al-topbar-user-name">{user?.name?.split(' ')[0] ?? 'Admin'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#94A3B8' }}>expand_more</span>
              </div>
            </div>
          </header>

          {/* ── Body (content + right sidebar) ── */}
          <div className="al-body">
            <main className="al-content">
              <Outlet />
            </main>

            {!rsCollapsed && (
              <aside className="al-rsidebar">
                {/* ── Header ── */}
                <div className="al-rs-header">
                  <span className="al-rs-title">Overview</span>
                  <button className="al-rs-close" onClick={() => setRsCollapsed(true)} title="Close panel">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* ── Quick Stats ── */}
                <div className="al-rs-section">
                  <div className="al-rs-section-label">Quick Stats</div>
                  <div className="al-rs-stats">
                    {rsData ? (
                      <>
                        <div className="al-rs-stat">
                          <div className="al-rs-stat-val">{stats.users?.toLocaleString() ?? '—'}</div>
                          <div className="al-rs-stat-lbl">Active Users</div>
                        </div>
                        <div className="al-rs-stat">
                          <div className="al-rs-stat-val">{stats.books?.toLocaleString() ?? '—'}</div>
                          <div className="al-rs-stat-lbl">Books</div>
                        </div>
                        <div className="al-rs-stat">
                          <div className="al-rs-stat-val">{stats.downloadsToday ?? '—'}</div>
                          <div className="al-rs-stat-lbl">Downloads Today</div>
                        </div>
                        <div className="al-rs-stat">
                          <div className="al-rs-stat-val">{stats.sessions?.toLocaleString() ?? '—'}</div>
                          <div className="al-rs-stat-lbl">AI Sessions</div>
                        </div>
                      </>
                    ) : (
                      [1, 2, 3, 4].map(i => (
                        <div key={i} className="al-rs-stat">
                          <div className="al-rs-skel" style={{ width: '60%', marginBottom: 6 }} />
                          <div className="al-rs-skel" style={{ width: '80%', height: 10 }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ── Pending Alerts ── */}
                <div className="al-rs-section">
                  <div className="al-rs-section-label">Loan Alerts</div>
                  <div className="al-rs-alerts">
                    {loanStats ? (
                      <>
                        <div className="al-rs-alert al-rs-alert-pending">
                          <span className="material-symbols-outlined al-rs-alert-icon" style={{ color: '#D97706' }}>pending_actions</span>
                          <div className="al-rs-alert-body">
                            <div className="al-rs-alert-label">Pending Requests</div>
                            <div className="al-rs-alert-sub">Awaiting approval</div>
                          </div>
                          <div className="al-rs-alert-count">{loanStats.pending ?? 0}</div>
                        </div>
                        <div className="al-rs-alert al-rs-alert-overdue">
                          <span className="material-symbols-outlined al-rs-alert-icon" style={{ color: '#E11D48' }}>schedule</span>
                          <div className="al-rs-alert-body">
                            <div className="al-rs-alert-label">Overdue</div>
                            <div className="al-rs-alert-sub">Past return date</div>
                          </div>
                          <div className="al-rs-alert-count">{loanStats.overdue ?? 0}</div>
                        </div>
                        <div className="al-rs-alert al-rs-alert-active">
                          <span className="material-symbols-outlined al-rs-alert-icon" style={{ color: '#16A34A' }}>check_circle</span>
                          <div className="al-rs-alert-body">
                            <div className="al-rs-alert-label">Active Loans</div>
                            <div className="al-rs-alert-sub">Currently borrowed</div>
                          </div>
                          <div className="al-rs-alert-count">{loanStats.active ?? 0}</div>
                        </div>
                      </>
                    ) : (
                      [1, 2, 3].map(i => (
                        <div key={i} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                          <div className="al-rs-skel" style={{ width: '70%', marginBottom: 5 }} />
                          <div className="al-rs-skel" style={{ width: '50%', height: 10 }} />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ── Recent Activity ── */}
                <div className="al-rs-section">
                  <div className="al-rs-section-label">Recent Joins</div>
                  <div className="al-rs-users">
                    {rsData ? (
                      recentUsers.length > 0 ? recentUsers.map((u) => {
                        const av = u.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() ?? '?';
                        return (
                          <div key={u.id} className="al-rs-user">
                            <div className="al-rs-user-av">{av}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="al-rs-user-name">{u.name}</div>
                              <div className="al-rs-user-meta">{u.faculty || u.role}</div>
                            </div>
                            <div className="al-rs-user-time">{timeAgo(u.createdAt)}</div>
                          </div>
                        );
                      }) : (
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8', textAlign: 'center', padding: '0.5rem 0' }}>No recent registrations</div>
                      )
                    ) : (
                      [1, 2, 3, 4].map(i => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E2E8F0', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div className="al-rs-skel" style={{ width: '65%', marginBottom: 4 }} />
                            <div className="al-rs-skel" style={{ width: '45%', height: 10 }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* ── System Status ── */}
                <div className="al-rs-section">
                  <div className="al-rs-section-label">System Status</div>
                  <div className="al-rs-sys">
                    {[
                      { name: 'API Server',    label: 'Online' },
                      { name: 'Database',      label: 'Online' },
                      { name: 'File Storage',  label: 'Online' },
                    ].map(({ name, label }) => (
                      <div key={name} className="al-rs-sys-row">
                        <span className="al-rs-sys-name">{name}</span>
                        <span className="al-rs-sys-badge">
                          <span className="al-rs-sys-dot" />
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
