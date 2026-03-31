import { useState }                        from 'react';
import { Outlet, NavLink, Navigate }       from 'react-router-dom';
import {
  FiGrid, FiBookOpen, FiUsers, FiBarChart2, FiLogOut, FiMenu,
} from 'react-icons/fi';
import { BsMicFill }  from 'react-icons/bs';
import useAuthStore   from '../../store/authStore';
import { useLogout }  from '../../hooks/useAuth';

const NAV = [
  { to: '/admin',           label: 'Dashboard', icon: FiGrid,      end: true },
  { to: '/admin/books',     label: 'Books',     icon: FiBookOpen             },
  { to: '/admin/users',     label: 'Users',     icon: FiUsers                },
  { to: '/admin/podcasts',  label: 'Podcasts',  icon: BsMicFill              },
  { to: '/admin/analytics', label: 'Analytics', icon: FiBarChart2            },
];

function SidebarContent({ user, logout, onNav }) {
  return (
    <>
      <div className="px-6 py-5 border-b border-white/10">
        <p className="font-serif text-lg font-bold">IUEA Library</p>
        <p className="text-[11px] text-white/50 mt-0.5 uppercase tracking-widest">
          Admin Panel
        </p>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/15 text-white border-r-2 border-white/60'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs font-semibold text-white/80 truncate">{user?.name}</p>
        <p className="text-[11px] text-white/40 truncate mb-3">{user?.email}</p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-white/55 hover:text-white transition-colors"
        >
          <FiLogOut size={13} /> Sign out
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { user }        = useAuthStore();
  const logout          = useLogout();
  const [open, setOpen] = useState(false);

  if (user && user.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary text-white sticky top-0 h-screen">
        <SidebarContent user={user} logout={logout} onNav={() => {}} />
      </aside>

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-primary text-white shadow-2xl lg:hidden">
            <SidebarContent user={user} logout={logout} onNav={() => setOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setOpen(true)}
            className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          >
            <FiMenu size={20} className="text-gray-600" />
          </button>
          <div className="flex-1" />
          <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide">
            Admin
          </span>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
