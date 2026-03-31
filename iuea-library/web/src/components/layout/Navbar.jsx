import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Mic2, User, Menu, X, LogOut } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQ,  setSearchQ]  = useState('');
  const { user }  = useAuthStore();
  const logout    = useLogout();
  const navigate  = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`);
      setSearchQ('');
    }
  };

  return (
    <header className="bg-primary text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
          <BookOpen size={22} className="text-accent" />
          IUEA Library
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center bg-primary-dark rounded-input px-3 py-1.5 gap-2 w-80">
          <Search size={15} className="text-primary-light shrink-0" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search books, authors…"
            className="bg-transparent text-sm text-white placeholder-primary-light outline-none flex-1"
          />
        </form>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <NavLink to="/search"   className={({ isActive }) => isActive ? 'text-accent' : 'hover:text-accent transition-colors'}>Search</NavLink>
          <NavLink to="/podcasts" className={({ isActive }) => isActive ? 'text-accent' : 'hover:text-accent transition-colors'}>
            <span className="flex items-center gap-1"><Mic2 size={14} /> Podcasts</span>
          </NavLink>
          {user ? (
            <>
              <NavLink to="/library" className={({ isActive }) => isActive ? 'text-accent' : 'hover:text-accent transition-colors'}>My Library</NavLink>
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-accent transition-colors">
                  <User size={16} /> {user.name.split(' ')[0]}
                </button>
                <div className="absolute right-0 mt-2 w-44 bg-white text-gray-700 rounded-card shadow-card opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-sm">
                  <Link to="/profile" className="block px-4 py-2 hover:bg-surface">Profile</Link>
                  {user.role === 'admin' && <Link to="/admin" className="block px-4 py-2 hover:bg-surface">Admin Panel</Link>}
                  <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-surface flex items-center gap-2 text-red-600">
                    <LogOut size={13} /> Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login"    className="hover:text-accent transition-colors">Login</Link>
              <Link to="/register" className="bg-accent text-primary font-semibold px-4 py-1.5 rounded-btn hover:bg-accent-light transition-colors text-sm">Sign Up</Link>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-primary-dark px-4 pb-4 space-y-3 text-sm">
          <form onSubmit={handleSearch} className="flex items-center bg-primary rounded-input px-3 py-2 gap-2 mt-2">
            <Search size={14} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search…"
              className="bg-transparent text-white placeholder-primary-light outline-none flex-1 text-sm"
            />
          </form>
          <Link to="/search"   onClick={() => setMenuOpen(false)} className="block py-1">Search</Link>
          <Link to="/podcasts" onClick={() => setMenuOpen(false)} className="block py-1">Podcasts</Link>
          {user ? (
            <>
              <Link to="/library" onClick={() => setMenuOpen(false)} className="block py-1">My Library</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-1">Profile</Link>
              <button onClick={logout} className="block py-1 text-red-400">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"    onClick={() => setMenuOpen(false)} className="block py-1">Login</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-1">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
