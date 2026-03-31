import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Mic2, Settings, LogOut,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';

const links = [
  { to: '/admin',        label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/books',  label: 'Books',     icon: BookOpen        },
  { to: '/admin/users',  label: 'Users',     icon: Users           },
  { to: '/admin/podcasts', label: 'Podcasts', icon: Mic2           },
  { to: '/admin/settings', label: 'Settings', icon: Settings       },
];

export default function AdminLayout() {
  const { user } = useAuthStore();
  const logout   = useLogout();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-white flex flex-col">
        <div className="p-6 border-b border-primary-light">
          <h1 className="font-serif text-xl font-semibold">IUEA Library</h1>
          <p className="text-xs text-primary-light mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive ? 'bg-primary-light font-medium' : 'hover:bg-primary-dark'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-light">
          <p className="text-xs text-primary-light mb-2">{user?.name}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm hover:text-accent transition-colors"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b px-8 py-4">
          <h2 className="font-semibold text-gray-700">Admin Dashboard</h2>
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
