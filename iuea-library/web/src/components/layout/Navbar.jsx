import { useState }                            from 'react';
import { Link, NavLink, useNavigate }          from 'react-router-dom';
import {
  FiSearch, FiBell, FiUser, FiMenu, FiX,
  FiLogOut, FiSettings,
} from 'react-icons/fi';
import useAuthStore  from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user }  = useAuthStore();
  const logout    = useLogout();
  const navigate  = useNavigate();

  const navLinks = [
    { to: '/home',      label: 'Home'      },
    { to: '/search',    label: 'Search'    },
    { to: '/library',   label: 'Library'   },
    { to: '/podcasts',  label: 'Podcasts'  },
    { to: '/downloads', label: 'Downloads' },
  ];

  return (
    <header
      className="sticky top-0 w-full z-40 h-16 flex justify-between items-center
                 px-4 md:px-8 bg-blush-100/80 backdrop-blur-xl
                 border-b border-border-line"
    >
      {/* Logo */}
      <Link to="/home" className="flex items-center gap-2 flex-shrink-0">
        <img
          src="/iuea_logo.png"
          alt="IUEA Logo"
          className="h-8 w-auto object-contain"
          onError={e => { e.currentTarget.style.display = 'none'; }}
        />
        <span className="font-serif text-lg font-bold text-primary ml-1">
          IUEA Library
        </span>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex items-center gap-6">
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-ink-500 hover:text-primary'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-sm font-medium transition-colors ${
                isActive ? 'text-gold-700 font-semibold' : 'text-gold-500 hover:text-gold-700'
              }`
            }
          >
            Admin
          </NavLink>
        )}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/search')}
          className="p-2 text-primary hover:bg-blush-200 rounded-full transition-colors"
          aria-label="Search"
        >
          <FiSearch size={20} />
        </button>

        {user && (
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 text-primary hover:bg-blush-200 rounded-full transition-colors relative"
            aria-label="Notifications"
          >
            <FiBell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
        )}

        {user ? (
          <div className="relative group">
            <button
              className="w-8 h-8 rounded-full overflow-hidden border border-border-line hover:ring-2 hover:ring-primary/20 transition-all"
              aria-label="Profile"
            >
              {user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-primary flex items-center justify-center">
                    <FiUser size={14} className="text-white" />
                  </div>
              }
            </button>

            <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-md
                            border border-border-line opacity-0 invisible
                            group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
              <div className="px-4 py-3 border-b border-border-line">
                <p className="text-sm font-semibold text-ink-900 truncate">{user.name}</p>
                <p className="text-xs text-ink-500 truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-900 hover:bg-blush-100 transition-colors">
                  <FiUser size={14} /> Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gold-700 hover:bg-blush-100 transition-colors">
                    <FiSettings size={14} /> Admin Panel
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-blush-100 transition-colors"
                >
                  <FiLogOut size={14} /> Sign out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-sm font-semibold px-4 py-2
                       bg-primary text-white rounded-xl
                       hover:bg-primary-dark transition-colors"
          >
            Sign In
          </Link>
        )}

        <button
          className="md:hidden p-2 text-primary hover:bg-blush-200 rounded-full"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menu"
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden absolute top-16 left-0 right-0
                     bg-blush-100/95 backdrop-blur-xl
                     border-b border-border-line z-40"
        >
          <div className="flex flex-col py-2">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-6 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-blush-200'
                      : 'text-ink-500 hover:bg-blush-200'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="px-6 py-3 text-sm text-error text-left hover:bg-blush-200 transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="px-6 py-3 text-sm font-semibold text-primary"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
