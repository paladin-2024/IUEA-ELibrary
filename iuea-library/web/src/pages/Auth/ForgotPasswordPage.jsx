import { useState } from 'react';
import { Link }     from 'react-router-dom';
import api          from '../../services/api';

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .fp-shell {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 1.5rem;
          font-family: Inter, sans-serif;
          color: #1C0A0C;
        }
        .fp-main {
          width: 100%;
          max-width: 480px;
        }
        .fp-card {
          background: #ffffff;
          border-radius: 0.75rem;
          padding: 2.5rem;
          box-shadow: 0 12px 40px rgba(74,8,16,0.06);
        }
        .fp-input {
          display: block;
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: #FCE8E6;
          border: none;
          border-radius: 0.5rem;
          font-family: Inter, sans-serif;
          font-size: 0.9375rem;
          color: #1C0A0C;
          outline: none;
          box-sizing: border-box;
          transition: box-shadow 0.2s, background 0.2s;
        }
        .fp-input::placeholder { color: rgba(139,113,112,0.6); }
        .fp-input:focus {
          box-shadow: 0 0 0 2px rgba(107,15,26,0.4);
          background: #ffffff;
        }
        .fp-btn {
          width: 100%;
          background: #5C0F1F;
          color: #fff;
          font-family: Inter, sans-serif;
          font-weight: 600;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 0.9375rem;
          letter-spacing: 0.025em;
          cursor: pointer;
          transition: background 0.3s, transform 0.1s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .fp-btn:hover:not(:disabled) { background: #8A1228; }
        .fp-btn:active { transform: scale(0.98); }
        .fp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .fp-back-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #8A1228;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: color 0.2s;
        }
        .fp-back-link:hover { color: #5C0F1F; }
        .fp-back-link .fp-back-icon {
          transition: transform 0.2s;
        }
        .fp-back-link:hover .fp-back-icon {
          transform: translateX(-3px);
        }
      `}</style>

      <div className="fp-shell">
        <main className="fp-main">

          {/* ── Editorial header ── */}
          <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
              <img
                src="/iuea_logo.png"
                alt="IUEA Official Logo"
                style={{ height: 80, width: 'auto', objectFit: 'contain' }}
              />
            </div>
            <h1 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '2.5rem', lineHeight: 1.2,
              color: '#1C0A0C', fontWeight: 700,
              marginBottom: '1rem',
            }}>
              Reset your password
            </h1>
            <p style={{ color: '#6B5456', fontFamily: 'Inter, sans-serif', fontSize: '1.125rem', maxWidth: '24rem', margin: '0 auto' }}>
              Enter your university email to receive a password reset link.
            </p>
          </div>

          {/* ── Card ── */}
          <div className="fp-card">
            {sent ? (
              /* Success state */
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(201,168,76,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <span className="material-symbols-outlined" style={{ color: '#B8964A', fontSize: '1.75rem' }}>mark_email_read</span>
                </div>
                <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.375rem', fontWeight: 700, color: '#8A1228', margin: '0 0 0.5rem' }}>
                  Check your inbox
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#6B5456', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                  We've sent a password reset link to <strong>{email}</strong>. Check your email and follow the instructions.
                </p>
                <Link to="/login" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.625rem 1.5rem', background: '#5C0F1F',
                  color: '#fff', borderRadius: '0.5rem', textDecoration: 'none',
                  fontSize: '0.875rem', fontWeight: 600,
                }}>
                  Back to Sign In
                </Link>
              </div>
            ) : (
              /* Form state */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Email field */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{
                    display: 'block', fontSize: '0.875rem', fontWeight: 600,
                    color: '#8A1228', letterSpacing: '0.025em',
                  }}>
                    University Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{
                      position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                      color: '#A89597', fontSize: '1.25rem', pointerEvents: 'none',
                    }}>
                      mail
                    </span>
                    <input
                      type="email"
                      className="fp-input"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      placeholder="e.g. name@iuea.ac.ug"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#ffdad6', borderRadius: '0.5rem',
                    padding: '0.625rem 0.875rem',
                  }}>
                    <span className="material-symbols-outlined" style={{ color: '#ba1a1a', fontSize: '1rem' }}>error</span>
                    <p style={{ fontSize: '0.8125rem', color: '#93000a', margin: 0 }}>{error}</p>
                  </div>
                )}

                <button type="submit" disabled={loading} className="fp-btn">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}

            {/* Back to sign in link — inside card */}
            {!sent && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                <Link to="/login" className="fp-back-link">
                  <span className="material-symbols-outlined fp-back-icon" style={{ fontSize: '1.125rem' }}>arrow_back</span>
                  <span>Back to Sign In</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── Decorative divider ── */}
          <div style={{
            marginTop: '3rem', display: 'flex', justifyContent: 'center',
            alignItems: 'center', gap: '1rem', opacity: 0.4, userSelect: 'none',
          }}>
            <div style={{ height: 1, width: 48, background: '#B8964A' }} />
            <span className="material-symbols-outlined" style={{
              color: '#755b00', fontSize: '1.25rem',
              fontVariationSettings: "'FILL' 1",
            }}>
              auto_stories
            </span>
            <div style={{ height: 1, width: 48, background: '#B8964A' }} />
          </div>

        </main>

        {/* ── Footer ── */}
        <footer style={{ marginTop: 'auto', paddingTop: '2rem', paddingBottom: '2rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.5rem 1rem', background: '#FCE8E6', borderRadius: 9999,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(88,65,65,0.6)' }}>
              Search and Auth powered by
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg style={{ height: 16, width: 16 }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.48 10.92v3.28h4.74c-.2 1.06-1.2 3.12-4.74 3.12-3.07 0-5.57-2.54-5.57-5.68s2.5-5.68 5.57-5.68c1.75 0 2.92.74 3.59 1.39l2.6-2.5c-1.67-1.56-3.83-2.5-6.19-2.5-5.32 0-9.63 4.31-9.63 9.63s4.31 9.63 9.63 9.63c5.55 0 9.24-3.91 9.24-9.41 0-.63-.07-1.11-.15-1.59h-9.09z" />
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(88,65,65,0.6)' }}>Google</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
