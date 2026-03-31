import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import Layout     from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import LoginPage    from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

// Main Pages
import HomePage     from './pages/Home/HomePage';
import LibraryPage  from './pages/Library/LibraryPage';
import BookPage     from './pages/Book/BookPage';
import ReaderPage   from './pages/Reader/ReaderPage';
import SearchPage   from './pages/Search/SearchPage';
import PodcastsPage from './pages/Podcasts/PodcastsPage';
import PodcastPage  from './pages/Podcasts/PodcastPage';
import ProfilePage  from './pages/Profile/ProfilePage';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('iuea_token');
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  const token    = localStorage.getItem('iuea_token');
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login"    element={<LoginPage />}    />
      <Route path="/register" element={<RegisterPage />} />

      {/* Main app routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search"   element={<SearchPage />} />
        <Route path="podcasts" element={<PodcastsPage />} />
        <Route path="podcasts/:id" element={<PodcastPage />} />
        <Route path="library"  element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
        <Route path="books/:id" element={<BookPage />} />
        <Route path="profile"  element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      </Route>

      {/* Reader — full screen, no layout */}
      <Route path="/reader/:id" element={<PrivateRoute><ReaderPage /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
