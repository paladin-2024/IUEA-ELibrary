import { useState }         from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin }       from '@react-oauth/google';
import toast                 from 'react-hot-toast';
import useAuthStore          from '../../store/authStore';

const IMG_BOOK =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDS6ioE0C3GGbHPIt5SkGbKbAKiqTZWWHXMtIcHWAXwgWSbss_2b8LFPz2gfAW9doh7VLA6qCCkiHraTkk4-ax7gV7AxJrlX7xVz8bpRuvHaLcFPgN-EHnQUxbmhxnNhDkXuPQebqZXU6pAe8eUHgrMJGQ7rU8NZ1WlG0Oaj9cTIjq9QHyMkbCGCoYceyrDtdQcvsx417ScZXPjmd6FSfQoEli7QQF8dget2_GzFIYbDlrSOlphhXaYBSQB7mVMbibm48FJFnlchDY';

const IMG_LIB_BG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBJ2RL2XjNtuGlMghHGoX8XozMxUY9UPhWFF8slC_qUxD7w1bgz7-rkLCmGkE55uubefBOcSVhqSiY0czvXBt59iQrZdoZcehQDQNcqU7OQ9gqrPaqTP0ptYXOqVNqzJuB_d14KOWgd5tK-odDLA7pQ5VpcrQiHPePuY2GAqjmn_NqTfxDzxKkoSxA0njOQwXLzhxcnKN4jyx4HsvC9fqO02Lao8UpTR5ZuNToX7G3AOeXvDOl9lcYHMhL7I-ulmpaKIJtwD9dA25c';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isLoading } = useAuthStore();
  const [form,   setForm]   = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [keepMe, setKeepMe] = useState(false);

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    const { ok } = await login(form);
    if (ok) navigate('/home');
    else toast.error(useAuthStore.getState().error ?? 'Login failed.');
  };

  const onGoogle = async cred => {
    const { ok, isNewUser } = await loginWithGoogle(cred.credential);
    if (ok) navigate(isNewUser ? '/onboarding' : '/home');
    else toast.error(useAuthStore.getState().error ?? 'Google sign-in failed.');
  };

  return (
    <>
      <style>{`
        .signin-input-group:focus-within .signin-icon { color: #56000f; }
        .signin-input {
          display: block; width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: #ffffff; border: none;
          border-radius: 0.75rem;
          box-shadow: 0 0 0 1px #dfbfbe;
          outline: none; transition: box-shadow 0.2s;
          color: #2d1418; font-family: Inter, sans-serif; font-size: 0.875rem;
        }
        .signin-input::placeholder { color: rgba(139,113,112,0.5); }
        .signin-input:focus { box-shadow: 0 0 0 2px #7b0d1e; }
        .signin-input-pw { padding-right: 2.75rem; }
        .signin-btn-primary {
          width: 100%; background: #7b0d1e; color: #fff;
          font-family: Inter, sans-serif; font-weight: 700;
          padding: 1rem; border-radius: 0.75rem; border: none;
          box-shadow: 0 4px 16px rgba(123,13,30,0.2);
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          cursor: pointer; transition: background 0.2s, transform 0.1s;
          font-size: 0.9375rem;
        }
        .signin-btn-primary:hover { background: #56000f; }
        .signin-btn-primary:active { transform: scale(0.98); }
        .signin-btn-primary:disabled { opacity: 0.6; cursor: default; }
        .signin-btn-google {
          width: 100%; background: #ffffff; color: #2d1418;
          font-family: Inter, sans-serif; font-weight: 600;
          padding: 1rem; border-radius: 0.75rem; border: none;
          box-shadow: 0 0 0 1px #dfbfbe;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          cursor: pointer; transition: background 0.2s, transform 0.1s;
          font-size: 0.9375rem;
        }
        .signin-btn-google:hover { background: #fff8f7; }
        .signin-btn-google:active { transform: scale(0.98); }
      `}</style>

      {/* body: bg-background = #fff8f7 */}
      <main
        style={{ background: '#fff8f7', fontFamily: 'Inter, sans-serif', color: '#2d1418', minHeight: '100vh', display: 'flex', flexDirection: 'row', alignItems: 'stretch', overflow: 'hidden' }}
      >
        {/* ══════════════════════════════════════
            LEFT — academic-gradient editorial panel
        ══════════════════════════════════════ */}
        <div style={{
          display: 'none',
          width: '50%', position: 'relative',
          flexDirection: 'column', justifyContent: 'space-between',
          padding: '4rem', overflow: 'hidden',
          background: 'linear-gradient(135deg, #56000f 0%, #7b0d1e 100%)',
        }} className="md-left-panel">
          <style>{`@media(min-width:768px){ .md-left-panel { display: flex !important; } }`}</style>

          {/* Grain overlay */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', mixBlendMode: 'overlay' }} />

          {/* Top: logo + headline + body */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* Logo row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '0.5rem',
                background: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8,
              }}>
                <img src="/iuea_logo.png" alt="IUEA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: 'Newsreader, serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                IUEA Library
              </span>
            </div>

            {/* h1 */}
            <h1 style={{
              fontFamily: 'Newsreader, serif',
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 700, color: '#fff',
              lineHeight: 1.1, marginBottom: '2rem', maxWidth: '36rem',
            }}>
              The{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#ffe08f' }}>Digital Curator</span>
              {' '}of Academic Excellence.
            </h1>

            {/* Body */}
            <p style={{ fontFamily: 'Inter, sans-serif', color: '#ffe9ea', fontSize: '1.125rem', maxWidth: '28rem', lineHeight: 1.7, opacity: 0.9 }}>
              Access over 500,000 digital resources, research papers, and curated collections
              from the heart of the International University of East Africa.
            </p>
          </div>

          {/* Bottom: book card + quote */}
          <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
            {/* Book card: w-48 h-64 bg-white rounded-lg shadow-2xl rotate-[-4deg] flex-col p-4 */}
            <div style={{
              width: 192, height: 256, background: '#ffffff', borderRadius: '0.5rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              transform: 'rotate(-4deg)', display: 'flex', flexDirection: 'column', padding: 16, flexShrink: 0,
            }}>
              {/* h-40 image area */}
              <div style={{ width: '100%', height: 160, background: '#fdcfd3', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
                <img src={IMG_BOOK} alt="Book" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {/* skeleton lines */}
              <div style={{ height: 8, width: '50%', background: 'rgba(123,13,30,0.2)', borderRadius: 9999, marginBottom: 8 }} />
              <div style={{ height: 8, width: '75%', background: 'rgba(123,13,30,0.1)', borderRadius: 9999 }} />
            </div>

            {/* Quote */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic', color: '#ffe08f', fontSize: '1.25rem' }}>
                "Knowledge is the light of the mind."
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
                Founding Principles
              </p>
            </div>
          </div>

          {/* Library background image */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <img
              src={IMG_LIB_BG} alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, mixBlendMode: 'luminosity' }}
            />
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT — bg-surface-container-low = #fff0f0
        ══════════════════════════════════════ */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(1.5rem, 6vw, 6rem)',
          background: '#fff0f0',
        }}>
          <div style={{ width: '100%', maxWidth: 448, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Mobile branding */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }} className="md-hide">
              <style>{`@media(min-width:768px){ .md-hide { display: none !important; } }`}</style>
              <div style={{ width: 64, height: 64, borderRadius: '1rem', background: '#7b0d1e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 10 }}>
                <img src="/iuea_logo.png" alt="IUEA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '1.875rem', fontWeight: 700, color: '#56000f' }}>IUEA Library</h2>
              <p style={{ color: '#584141', fontSize: '0.875rem' }}>Sign in to your curator account</p>
            </div>

            {/* Desktop heading */}
            <div>
              <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '2.25rem', fontWeight: 700, color: '#56000f', marginBottom: 8 }}>
                Welcome Back
              </h2>
              <p style={{ color: '#584141', fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem' }}>
                Enter your credentials to access the archive.
              </p>
            </div>

            {/* ── Auth Form ── */}
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#584141', marginLeft: 4 }}>
                  University Email
                </label>
                <div className="signin-input-group" style={{ position: 'relative' }}>
                  <div className="signin-icon" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '0.875rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#8b7170', transition: 'color 0.2s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>mail</span>
                  </div>
                  <input
                    className="signin-input" name="email" type="email"
                    value={form.email} onChange={onChange}
                    placeholder="name@iuea.ac.ug" required autoFocus
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginLeft: 4 }}>
                  <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#584141' }}>
                    Security Key
                  </label>
                  <Link to="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#56000f', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.target.style.color = '#7b0d1e')}
                    onMouseLeave={e => (e.target.style.color = '#56000f')}>
                    Forgot password?
                  </Link>
                </div>
                <div className="signin-input-group" style={{ position: 'relative' }}>
                  <div className="signin-icon" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, paddingLeft: '0.875rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#8b7170', transition: 'color 0.2s' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>lock</span>
                  </div>
                  <input
                    className="signin-input signin-input-pw" name="password"
                    type={showPw ? 'text' : 'password'}
                    value={form.password} onChange={onChange}
                    placeholder="••••••••" required
                  />
                  <button
                    type="button" onClick={() => setShowPw(v => !v)}
                    style={{ position: 'absolute', top: 0, bottom: 0, right: 0, paddingRight: '0.875rem', display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#8b7170', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#56000f')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#8b7170')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
                <input
                  type="checkbox" id="remember" checked={keepMe}
                  onChange={e => setKeepMe(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#7b0d1e', cursor: 'pointer', borderRadius: 4 }}
                />
                <label htmlFor="remember" style={{ fontSize: '0.875rem', color: '#584141', userSelect: 'none', cursor: 'pointer' }}>
                  Keep me signed in for 30 days
                </label>
              </div>

              {/* Sign In button */}
              <button type="submit" disabled={isLoading} className="signin-btn-primary">
                {isLoading ? 'Signing in…' : (
                  <>
                    Sign In
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>login</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider — bg must match panel: #fff0f0 */}
            <div style={{ position: 'relative', padding: '1rem 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', borderTop: '1px solid #dfbfbe' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{ padding: '0 1rem', background: '#fff0f0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#584141', fontWeight: 500 }}>
                  Authentication Options
                </span>
              </div>
            </div>

            {/* Google SSO button */}
            <button
              type="button" className="signin-btn-google"
              onClick={() => document.getElementById('__g_btn__')?.querySelector('div[role="button"]')?.click()}
            >
              <GoogleSvg />
              Continue with Google
            </button>
            <div id="__g_btn__" style={{ display: 'none' }}>
              <GoogleLogin onSuccess={onGoogle} onError={() => {}} />
            </div>

            {/* Register link */}
            <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#584141' }}>
                New student?{' '}
                <Link to="/register" style={{ color: '#56000f', fontWeight: 700, marginLeft: 4, textDecoration: 'none', textUnderlineOffset: 4 }}
                  onMouseEnter={e => (e.target.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.target.style.textDecoration = 'none')}>
                  Register here
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <footer style={{ marginTop: 'auto', paddingTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, opacity: 0.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: 10, fontFamily: 'Inter, sans-serif', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#584141' }}>
              {['Privacy Policy', 'Terms of Service', 'Help Center'].map((t, i, a) => (
                <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}
                    onMouseEnter={e => (e.target.style.color = '#56000f')}
                    onMouseLeave={e => (e.target.style.color = '#584141')}>{t}</a>
                  {i < a.length - 1 && <span style={{ width: 4, height: 4, borderRadius: 9999, background: '#dfbfbe', display: 'inline-block' }} />}
                </span>
              ))}
            </div>
            <p style={{ fontSize: 9, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#584141', opacity: 0.8 }}>
              © 2024 International University of East Africa • Digital Curator v2.4
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

function GoogleSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
