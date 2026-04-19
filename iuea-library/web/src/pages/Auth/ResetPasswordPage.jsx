import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ResetPasswordPage() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get('token');

  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState('');

  // If no token in URL, show error immediately
  useEffect(() => {
    if (!token) setError('Invalid or missing reset link. Please request a new one.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', fontFamily: 'Inter, sans-serif' }}>
      <main style={{ width: '100%', maxWidth: 480 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <img src="/iuea_logo.png" alt="IUEA Logo" style={{ height: 80, width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.5rem', lineHeight: 1.2, color: '#1C0A0C', fontWeight: 700, marginBottom: '1rem' }}>
            {done ? 'Password updated!' : 'Choose a new password'}
          </h1>
          {!done && (
            <p style={{ color: '#6B5456', fontSize: '1.125rem', maxWidth: '24rem', margin: '0 auto' }}>
              Enter your new password below.
            </p>
          )}
        </div>

        {/* Card */}
        <div style={{ background: '#ffffff', borderRadius: '0.75rem', padding: '2.5rem', boxShadow: '0 12px 40px rgba(74,8,16,0.06)' }}>

          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(201,168,76,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <span className="material-symbols-outlined" style={{ color: '#B8964A', fontSize: '1.75rem' }}>check_circle</span>
              </div>
              <p style={{ color: '#6B5456', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Your password has been updated. Redirecting you to sign in…
              </p>
              <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 1.5rem', background: '#5C0F1F', color: '#fff', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                Go to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* New password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#8A1228', letterSpacing: '0.025em' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89597', fontSize: '1.125rem', pointerEvents: 'none' }}>lock</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Min. 8 characters"
                    required
                    style={{ width: '100%', padding: '0.875rem 2.75rem 0.875rem 2.75rem', background: '#FCE8E6', border: 'none', borderRadius: '0.5rem', fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#1C0A0C', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(107,15,26,0.3)')}
                    onBlur={e  => (e.target.style.boxShadow = 'none')}
                  />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A89597', padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#8A1228', letterSpacing: '0.025em' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#A89597', fontSize: '1.125rem', pointerEvents: 'none' }}>lock</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError(''); }}
                    placeholder="Re-enter password"
                    required
                    style={{ width: '100%', padding: '0.875rem 1rem 0.875rem 2.75rem', background: '#FCE8E6', border: 'none', borderRadius: '0.5rem', fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#1C0A0C', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(107,15,26,0.3)')}
                    onBlur={e  => (e.target.style.boxShadow = 'none')}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffdad6', borderRadius: '0.5rem', padding: '0.625rem 0.875rem' }}>
                  <span className="material-symbols-outlined" style={{ color: '#ba1a1a', fontSize: '1rem' }}>error</span>
                  <p style={{ fontSize: '0.8125rem', color: '#93000a', margin: 0 }}>{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading || !token}
                style={{ padding: '1rem', background: (loading || !token) ? 'rgba(107,15,26,0.5)' : '#5C0F1F', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.9375rem', fontWeight: 600, cursor: (loading || !token) ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', letterSpacing: '0.025em' }}>
                {loading ? 'Updating…' : 'Set New Password'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Link to="/forgot-password" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8A1228', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>arrow_back</span>
                  Request a new link
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Decorative divider */}
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', opacity: 0.4, userSelect: 'none' }}>
          <div style={{ height: 1, width: 48, background: '#B8964A' }} />
          <span className="material-symbols-outlined" style={{ color: '#755b00', fontSize: '1.25rem', fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
          <div style={{ height: 1, width: 48, background: '#B8964A' }} />
        </div>
      </main>
    </div>
  );
}
