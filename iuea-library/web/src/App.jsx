import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate }   from 'react-router-dom';
import useAuthStore                  from './store/authStore';

// ── Layouts (always needed, load eagerly) ─────────────────────────────────────
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout     from './components/layout/AdminLayout';

// ── Auth pages (shown before login — load eagerly) ───────────────────────────
import SplashPage         from './pages/SplashPage';
import LoginPage          from './pages/Auth/LoginPage';
import RegisterPage       from './pages/Auth/RegisterPage';
import LanguageSetupPage  from './pages/Auth/LanguageSetupPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/Auth/ResetPasswordPage';

// ── Home (first page after login — load eagerly) ─────────────────────────────
import HomePage from './pages/Home/HomePage';

// ── All other pages — lazy-loaded per route ───────────────────────────────────
const SearchPage              = lazy(() => import('./pages/Search/SearchPage'));
const BookPage                = lazy(() => import('./pages/Book/BookPage'));
const BookDetailPage          = lazy(() => import('./pages/Home/BookDetailPage'));
const AuthorPage              = lazy(() => import('./pages/Home/AuthorPage'));
const FacultyBrowsePage       = lazy(() => import('./pages/Home/FacultyBrowsePage'));

const LibraryPage             = lazy(() => import('./pages/Library/LibraryPage'));
const DownloadsPage           = lazy(() => import('./pages/Library/DownloadsPage'));
const CollectionsPage         = lazy(() => import('./pages/Library/CollectionsPage'));
const HighlightsPage          = lazy(() => import('./pages/Library/HighlightsPage'));

const PodcastsPage            = lazy(() => import('./pages/Podcasts/PodcastsPage'));
const PodcastPage             = lazy(() => import('./pages/Podcasts/PodcastPage'));
const EpisodePlayerPage       = lazy(() => import('./pages/Podcasts/EpisodePlayerPage'));

const ProfilePage             = lazy(() => import('./pages/Profile/ProfilePage'));
const ReadingPreferencesPage  = lazy(() => import('./pages/Profile/ReadingPreferencesPage'));
const LanguagePreferencesPage = lazy(() => import('./pages/Profile/LanguagePreferencesPage'));
const NotificationsPage       = lazy(() => import('./pages/Profile/NotificationsPage'));

const SettingsPage            = lazy(() => import('./pages/Settings/SettingsPage'));

const ReaderPage              = lazy(() => import('./pages/Reader/ReaderPage'));
const AudioPlayerPage         = lazy(() => import('./pages/Reader/AudioPlayerPage'));

const AdminDashboard          = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminBooksPage          = lazy(() => import('./pages/Admin/AdminBooksPage'));
const AdminUsersPage          = lazy(() => import('./pages/Admin/AdminUsersPage'));
const AdminAnalyticsPage      = lazy(() => import('./pages/Admin/AdminAnalyticsPage'));

// ── Route guards ──────────────────────────────────────────────────────────────
const _getToken = () => {
  try { return JSON.parse(localStorage.getItem('iuea_auth'))?.state?.token; }
  catch { return null; }
};

const PrivateRoute = ({ children }) =>
  _getToken() ? children : <Navigate to="/login" replace />;

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  const token    = _getToken();
  if (!token)                 return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/home"  replace />;
  return children;
};

// ── Minimal page-level fallback ───────────────────────────────────────────────
function PageFallback() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid #FDF4F2', borderTopColor: '#5C0F1F',
        animation: 'app-spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes app-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { loadUser } = useAuthStore();
  useEffect(() => { loadUser(); }, []);

  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        {/* ── Landing ────────────────────────────────────────────────────── */}
        <Route path="/" element={<SplashPage />} />

        {/* ── Auth ───────────────────────────────────────────────────────── */}
        <Route path="/login"           element={<LoginPage />}          />
        <Route path="/register"        element={<RegisterPage />}       />
        <Route path="/onboarding"      element={<LanguageSetupPage />}  />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />}  />

        {/* ── Main app — DashboardLayout ──────────────────────────────────── */}
        <Route path="/home" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route index element={<HomePage />} />

          {/* Discovery */}
          <Route path="search"           element={<SearchPage />}        />
          <Route path="books/:id"        element={<BookPage />}          />
          <Route path="authors/:name"    element={<AuthorPage />}        />
          <Route path="faculty/:faculty" element={<FacultyBrowsePage />} />

          {/* Library */}
          <Route path="library"             element={<LibraryPage />}     />
          <Route path="library/downloads"   element={<DownloadsPage />}   />
          <Route path="library/collections" element={<CollectionsPage />} />
          <Route path="library/highlights"  element={<HighlightsPage />}  />

          {/* Podcasts */}
          <Route path="podcasts"                   element={<PodcastsPage />}      />
          <Route path="podcasts/:id"               element={<PodcastPage />}       />
          <Route path="podcasts/:id/episodes/:eid" element={<EpisodePlayerPage />} />

          {/* Profile */}
          <Route path="profile"                      element={<ProfilePage />}             />
          <Route path="profile/reading-preferences"  element={<ReadingPreferencesPage />}  />
          <Route path="profile/language-preferences" element={<LanguagePreferencesPage />} />
          <Route path="profile/notifications"        element={<NotificationsPage />}       />

          {/* Settings */}
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* ── Public book detail ──────────────────────────────────────────── */}
        <Route path="/books/:id" element={<BookDetailPage />} />

        {/* ── Full-screen reader & audio ──────────────────────────────────── */}
        <Route path="/reader/:id" element={<PrivateRoute><ReaderPage />      </PrivateRoute>} />
        <Route path="/audio/:id"  element={<PrivateRoute><AudioPlayerPage /> </PrivateRoute>} />

        {/* ── Admin ───────────────────────────────────────────────────────── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index            element={<AdminDashboard />}     />
          <Route path="books"     element={<AdminBooksPage />}     />
          <Route path="users"     element={<AdminUsersPage />}     />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        {/* ── Catch-all ───────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
