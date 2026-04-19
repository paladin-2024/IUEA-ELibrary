import { NavLink }    from 'react-router-dom';
import useAuthStore  from '../../store/authStore';

const NAV_ITEMS = [
  { to: '/home',          icon: 'home',          label: 'Home'     },
  { to: '/home/search',   icon: 'search',        label: 'Books'    },
  { to: '/home/podcasts', icon: 'podcasts',       label: 'Podcasts' },
  { to: '/home/library',  icon: 'library_books',  label: 'Library'  },
  { to: '/home/profile',  icon: 'person',         label: 'Profile'  },
];

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  if (!user) return null;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 64,
      background: 'rgba(252,232,230,0.95)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid #EBD2CF',
      boxShadow: '0 -4px 20px rgba(107,15,26,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      padding: '0 8px',
    }}>
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/home'}
          style={{ textDecoration: 'none' }}
        >
          {({ isActive }) => (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 14px', borderRadius: 12, minWidth: 52,
              background: isActive ? 'rgba(107,15,26,0.08)' : 'transparent',
              transition: 'background 0.18s ease',
            }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 22,
                color: isActive ? '#8A1228' : '#A89597',
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                transition: 'color 0.18s ease',
              }}>{icon}</span>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: 9, fontWeight: isActive ? 700 : 500,
                color: isActive ? '#8A1228' : '#A89597',
                letterSpacing: '0.01em',
              }}>{label}</span>
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
