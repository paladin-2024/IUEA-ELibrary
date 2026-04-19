import { NavLink } from 'react-router-dom';
import {
  FiHome, FiSearch, FiBookOpen, FiMic, FiUser, FiSettings,
} from 'react-icons/fi';
import useAuthStore from '../../store/authStore';

const links = [
  { to: '/',         icon: FiHome,     label: 'Home'       },
  { to: '/search',   icon: FiSearch,   label: 'Search'     },
  { to: '/library',  icon: FiBookOpen, label: 'Library',  auth: true },
  { to: '/podcasts', icon: FiMic,      label: 'Podcasts'  },
  { to: '/profile',  icon: FiUser,     label: 'Profile',  auth: true },
];

export default function DesktopSidebar() {
  const { user } = useAuthStore();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 h-full py-6 px-3 gap-1">
      {/* Brand */}
      <NavLink to="/" className="flex items-center gap-2 px-3 mb-6 font-serif text-lg font-semibold text-primary">
        <FiBookOpen size={20} className="text-accent" />
        IUEA Library
      </NavLink>

      {links
        .filter((l) => !l.auth || user)
        .map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}

      {user?.role === 'admin' && (
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-auto ${
              isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
            }`
          }
        >
          <FiSettings size={18} />
          Admin Panel
        </NavLink>
      )}
    </aside>
  );
}
