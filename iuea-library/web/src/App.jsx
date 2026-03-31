import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Layout
import Layout     from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Auth Pages
import LoginPage         from './pages/Auth/LoginPage';
import RegisterPage      from './pages/Auth/RegisterPage';
import LanguageSetupPage from './pages/Auth/LanguageSetupPage';
import BookDetailPage    from './pages/Home/BookDetailPage';

// Main Pages
import HomePage     from './pages/Home/HomePage';
import LibraryPage  from './pages/Library/LibraryPage';
import BookPage     from './pages/Book/BookPage';
import ReaderPage   from './pages/Reader/ReaderPage';
import SearchPage   from './pages/Search/SearchPage';
import PodcastsPage from './pages/Podcasts/PodcastsPage';
import PodcastPage  from './pages/Podcasts/PodcastPage';
import ProfilePage  from './pages/Profile/ProfilePage';

// Profile sub-pages
import ReadingPreferencesPage  from './pages/Profile/ReadingPreferencesPage';
import LanguagePreferencesPage from './pages/Profile/LanguagePreferencesPage';

// Admin Pages
import AdminDashboard    from './pages/Admin/AdminDashboard';
import AdminBooksPage    from './pages/Admin/AdminBooksPage';
import AdminUsersPage    from './pages/Admin/AdminUsersPage';
import AdminAnalyticsPage from './pages/Admin/AdminAnalyticsPage';

const _getToken = () => {
  try { return JSON.parse(localStorage.getItem('iuea_auth'))?.state?.token; }
  catch { return null; }
};

const PrivateRoute = ({ children }) => {
  return _getToken() ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  const token    = _getToken();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login"      element={<LoginPage />}         />
      <Route path="/register"   element={<RegisterPage />}      />
      <Route path="/onboarding" element={<LanguageSetupPage />} />

      {/* Main app routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/home" replace />} />
      </Route>
      <Route path="/home" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="search"   element={<SearchPage />} />
        <Route path="podcasts" element={<PodcastsPage />} />
        <Route path="podcasts/:id" element={<PodcastPage />} />
        <Route path="library"  element={<PrivateRoute><LibraryPage /></PrivateRoute>} />
        <Route path="books/:id" element={<BookPage />} />
        <Route path="profile"  element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="profile/reading-preferences"  element={<PrivateRoute><ReadingPreferencesPage /></PrivateRoute>} />
        <Route path="profile/language-preferences" element={<PrivateRoute><LanguagePreferencesPage /></PrivateRoute>} />
      </Route>

      {/* Book detail — inside layout */}
      <Route path="/books/:id" element={<BookDetailPage />} />

      {/* Reader — full screen, no layout */}
      <Route path="/reader/:id" element={<PrivateRoute><ReaderPage /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index                element={<AdminDashboard />}     />
        <Route path="books"         element={<AdminBooksPage />}     />
        <Route path="users"         element={<AdminUsersPage />}     />
        <Route path="analytics"     element={<AdminAnalyticsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
