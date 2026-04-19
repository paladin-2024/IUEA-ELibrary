import { useState }         from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast                 from 'react-hot-toast';
import useAuthStore          from '../../store/authStore';

const FACULTIES = [
  'Faculty of Science & Technology',
  'Faculty of Business & Management',
  'Faculty of Law',
  'Faculty of Engineering',
  'Faculty of Education',
  'Faculty of Arts & Social Sciences',
];

const FEATURES = [
  'Personalized Faculty Recommendations',
  'Offline Reading for Mobile Devices',
  'Exclusive IUEA Podcast Access',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [form, setForm] = useState({ name: '', studentId: '', email: '', faculty: '', password: '' });
  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    const { ok } = await register(form);
    if (ok) navigate('/onboarding');
    else toast.error(useAuthStore.getState().error ?? 'Registration failed.');
  };

  return (
    <>
      <style>{`
        /* ── page shell ── */
        .rp-shell {
          min-height: 100vh;
          background: #fff0f0;
          font-family: Inter, sans-serif;
          color: #2d1418;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        /* ── card ── */
        .rp-card {
          width: 100%;
          max-width: 1024px;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.12);
          background: #ffffff;
          border: 1px solid rgba(223,191,190,0.15);
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 768px) {
          .rp-card { grid-template-columns: 1fr 1fr; }
        }

        /* ── left panel ── */
        .rp-left {
          background: linear-gradient(135deg, #56000F 0%, #7B0D1E 100%);
          padding: 3rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          min-height: 520px;
        }
        .rp-left-blur-1 {
          position: absolute; bottom: -6rem; left: -6rem;
          width: 20rem; height: 20rem;
          background: #7b0d1e; border-radius: 50%;
          filter: blur(48px); opacity: 0.4; pointer-events: none;
        }
        .rp-left-blur-2 {
          position: absolute; top: -6rem; right: -6rem;
          width: 16rem; height: 16rem;
          background: #e6c364; border-radius: 50%;
          filter: blur(48px); opacity: 0.1; pointer-events: none;
        }

        /* ── right panel ── */
        .rp-right {
          background: #ffffff;
          padding: 3rem 3.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (max-width: 767px) {
          .rp-right { padding: 2rem; }
          .rp-mobile-brand { display: block !important; }
        }

        /* ── form inputs ── */
        .rp-input, .rp-select {
          width: 100%;
          background: #fff0f0;
          border: none;
          border-radius: 0.5rem;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          color: #2d1418;
          font-family: Inter, sans-serif;
          font-size: 0.875rem;
          outline: none;
          transition: box-shadow 0.2s;
          appearance: none;
          box-sizing: border-box;
        }
        .rp-input::placeholder { color: #8b7170; }
        .rp-select::placeholder { color: #8b7170; }
        .rp-input:focus, .rp-select:focus {
          box-shadow: 0 0 0 2px rgba(123,13,30,0.2);
        }
        .rp-select { padding-right: 2.5rem; cursor: pointer; }

        /* icon turns primary when sibling input focused */
        .rp-field:focus-within .rp-field-icon { color: #56000f; }

        /* ── submit button ── */
        .rp-btn {
          width: 100%;
          background: #7b0d1e;
          color: #fff;
          font-family: Inter, sans-serif;
          font-weight: 600;
          padding: 1rem;
          border-radius: 0.5rem;
          border: none;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 16px rgba(123,13,30,0.2);
        }
        .rp-btn:hover:not(:disabled) { background: #56000f; }
        .rp-btn:active { transform: scale(0.98); }
        .rp-btn:disabled { opacity: 0.6; cursor: default; }

        /* ── decorative absolute elements (inside shell) ── */
        .rp-deco-iuea {
          position: absolute; top: 2rem; left: 2rem;
          opacity: 0.2; pointer-events: none; user-select: none;
          z-index: 0;
        }
        .rp-deco-book {
          position: absolute; bottom: 2rem; right: 2rem;
          opacity: 0.1; pointer-events: none; user-select: none;
          z-index: 0;
        }
        .rp-card { position: relative; z-index: 1; }
      `}</style>

      {/* ── page shell — contains everything ── */}
      <div className="rp-shell">

        {/* IUEA watermark — top-left */}
        <div className="rp-deco-iuea">
          <span style={{
            fontFamily: 'Newsreader, serif', fontSize: '5rem',
            fontWeight: 700, color: '#56000f',
            transform: 'rotate(-5deg)', display: 'block', lineHeight: 1,
          }}>
            IUEA
          </span>
        </div>

        {/* Book icon — bottom-right */}
        <div className="rp-deco-book">
          <span className="material-symbols-outlined" style={{ fontSize: 120, color: '#56000f', display: 'block' }}>
            auto_stories
          </span>
        </div>

        <div className="rp-card">

          {/* ════════════════════════════
              LEFT — maroon brand panel
          ════════════════════════════ */}
          <div className="rp-left">
            <div className="rp-left-blur-1" />
            <div className="rp-left-blur-2" />

            {/* Top: logo + headline + description */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Logo row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
                <div style={{
                  width: 40, height: 40, background: '#c9a84c',
                  borderRadius: '0.5rem', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: 7, flexShrink: 0,
                }}>
                  <img src="/iuea_logo.png" alt="IUEA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <span style={{ fontFamily: 'Newsreader, serif', fontSize: '1.375rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                  IUEA Library
                </span>
              </div>

              {/* h1 — text-5xl leading-tight mb-6 */}
              <h1 style={{
                fontFamily: 'Newsreader, serif',
                fontSize: 'clamp(2.2rem, 4vw, 3rem)',
                fontWeight: 700, color: '#fff',
                lineHeight: 1.2, marginBottom: '1.5rem',
              }}>
                Step into the{' '}
                <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#ffe08f' }}>
                  Digital Curator.
                </span>
              </h1>

              {/* Description */}
              <p style={{ color: '#ffb3b3', fontSize: '1rem', lineHeight: 1.7, maxWidth: '26rem' }}>
                Access over 50,000 digital volumes, academic journals, and curated podcasts.
                Your portal to the International University of East Africa's scholarly excellence starts here.
              </p>
            </div>

            {/* Bottom: feature checklist */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {FEATURES.map(feat => (
                <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.8)' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>check</span>
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ════════════════════════════
              RIGHT — form panel
          ════════════════════════════ */}
          <div className="rp-right">

            {/* Mobile-only branding */}
            <div style={{ display: 'none' }} className="rp-mobile-brand">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, background: '#c9a84c',
                    borderRadius: '0.5rem', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 6, flexShrink: 0,
                  }}>
                    <img src="/iuea_logo.png" alt="IUEA" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <span style={{ fontFamily: 'Newsreader, serif', fontSize: '1.375rem', fontWeight: 700, color: '#56000f', letterSpacing: '-0.02em' }}>
                    IUEA Library
                  </span>
                </div>
              </div>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontFamily: 'Newsreader, serif', fontSize: '2rem', fontWeight: 700, color: '#56000f', marginBottom: '0.5rem' }}>
                Create Account
              </h2>
              <p style={{ color: '#584141', fontSize: '0.875rem' }}>
                Join our academic community today.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              <RpField label="Full Name" icon="person">
                <input className="rp-input" name="name" type="text"
                  value={form.name} onChange={onChange}
                  placeholder="Enter your full name" required autoFocus />
              </RpField>

              <RpField label="Student / Staff ID" icon="badge">
                <input className="rp-input" name="studentId" type="text"
                  value={form.studentId} onChange={onChange}
                  placeholder="e.g. 23/UG/456" />
              </RpField>

              <RpField label="Institutional Email" icon="mail">
                <input className="rp-input" name="email" type="email"
                  value={form.email} onChange={onChange}
                  placeholder="name@iuea.ac.ug" required />
              </RpField>

              <RpField label="Faculty" icon="school">
                <select className="rp-select" name="faculty"
                  value={form.faculty} onChange={onChange}>
                  <option value="" disabled>Select your Faculty</option>
                  {FACULTIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                {/* chevron */}
                <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, paddingRight: '0.875rem', display: 'flex', alignItems: 'center', pointerEvents: 'none', color: '#8b7170' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>expand_more</span>
                </div>
              </RpField>

              <RpField label="Password" icon="lock">
                <input className="rp-input" name="password" type="password"
                  value={form.password} onChange={onChange}
                  placeholder="Min. 8 characters" required minLength={8} />
              </RpField>

              {/* Submit */}
              <div style={{ paddingTop: '0.75rem' }}>
                <button type="submit" disabled={isLoading} className="rp-btn">
                  {isLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </div>

              {/* Sign in link */}
              <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
                <p style={{ color: '#584141', fontSize: '0.875rem' }}>
                  Already have an account?{' '}
                  <Link to="/login"
                    style={{ color: '#56000f', fontWeight: 700, marginLeft: 4, textDecoration: 'none' }}
                    onMouseEnter={e => (e.target.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.target.style.textDecoration = 'none')}>
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            {/* Footer */}
            <footer style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ffe9ea', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                {['Privacy', 'Terms', 'Books API'].map(t => (
                  <a key={t} href="#"
                    style={{ fontSize: 10, color: '#8b7170', textTransform: 'uppercase', letterSpacing: '0.12em', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.target.style.color = '#56000f')}
                    onMouseLeave={e => (e.target.style.color = '#8b7170')}>
                    {t}
                  </a>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#8b7170', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.65 }}>
                <span>Powered by</span>
                <svg style={{ height: 11 }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h4.74c-.2 1.06-1.2 3.12-4.74 3.12-3.07 0-5.57-2.54-5.57-5.68s2.5-5.68 5.57-5.68c1.75 0 2.92.74 3.59 1.39l2.6-2.5c-1.67-1.56-3.83-2.5-6.19-2.5-5.32 0-9.63 4.31-9.63 9.63s4.31 9.63 9.63 9.63c5.55 0 9.24-3.91 9.24-9.41 0-.63-.07-1.11-.15-1.59h-9.09z" />
                </svg>
                <span>Google</span>
              </div>
            </footer>
          </div>

        </div>
      </div>
    </>
  );
}

/* ── field wrapper with left icon ──────────────────────────────────────────── */
function RpField({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        fontSize: '0.7rem', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: '#584141', marginLeft: 2,
      }}>
        {label}
      </label>
      <div className="rp-field" style={{ position: 'relative' }}>
        <div className="rp-field-icon" style={{
          position: 'absolute', top: 0, bottom: 0, left: 0,
          paddingLeft: '0.875rem', display: 'flex', alignItems: 'center',
          pointerEvents: 'none', color: '#8b7170', transition: 'color 0.2s',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1 }}>
            {icon}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
