import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate }   from 'react-router-dom';
import useAuthStore                  from './store/authStore';

// ── Layout ────────────────────────────────────────────────────────────────────
import AdminLayout from './components/layout/AdminLayout';

// ── Auth pages (load eagerly) ─────────────────────────────────────────────────
import SplashPage         from './pages/SplashPage';
import LoginPage          from './pages/Auth/LoginPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage  from './pages/Auth/ResetPasswordPage';

// ── Admin pages — lazy-loaded ─────────────────────────────────────────────────
const AdminDashboard     = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminBooksPage     = lazy(() => import('./pages/Admin/AdminBooksPage'));
const AdminUsersPage     = lazy(() => import('./pages/Admin/AdminUsersPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/Admin/AdminAnalyticsPage'));
const AdminLoansPage     = lazy(() => import('./pages/Admin/AdminLoansPage'));

// ── Route guard ───────────────────────────────────────────────────────────────
const _getToken = () => {
  try { return JSON.parse(localStorage.getItem('iuea_auth'))?.state?.token; }
  catch { return null; }
};

const AdminRoute = ({ children }) => {
  const { user } = useAuthStore();
  const token    = _getToken();
  if (!token)               return <Navigate to="/login" replace />;
  if (!user)                return <PageFallback />;          // loadUser() still in flight
  if (user.role !== 'admin') return <Navigate to="/login" replace />;
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />}  />

        {/* ── Admin ───────────────────────────────────────────────────────── */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index            element={<AdminDashboard />}     />
          <Route path="books"     element={<AdminBooksPage />}     />
          <Route path="users"     element={<AdminUsersPage />}     />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="loans"     element={<AdminLoansPage />}     />
        </Route>

        {/* ── Catch-all ───────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
