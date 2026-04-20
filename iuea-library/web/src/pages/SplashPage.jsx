import { useEffect, useState } from 'react';
import { useNavigate, Link }   from 'react-router-dom';
import useAuthStore             from '../store/authStore';

/* ── image from HTML design ─────────────────────────────────────────────── */
const LIBRARY_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBWFMqO_ninYPJgxtBDdJcvX0Rr8eyT6ivi1JGKwr9LbEykezKAvF1w-ic_CRUCF9O4lzmSDxZj_UfZzksPSBZmrnPUwwyxC2rQ07-J3SZDAj4ftLsltmQwhdK4p94Ueuy2618EvDHVZCn3oMzO6B7eCV1a2vaoVqaaihze635_7Llm0yJ4jZO9co4o9rgeBWHsQ2DuajM3BzqDc2Gc3mAW1RiqdwgC5ouCZfTo1MoLo-D_95upmKBHQUvh175sdjFrOeRKErNSuco';

export default function SplashPage() {
  const navigate        = useNavigate();
  const { token }       = useAuthStore();
  const [lang, setLang] = useState('en');

  useEffect(() => {
    if (token) navigate('/admin', { replace: true });
  }, [token, navigate]);

  return (
    <>
      {/* ── Global styles injected inline so no Tailwind custom tokens needed ── */}
      <style>{`
        .splash-hero-gradient {
          background: radial-gradient(circle at top right, rgba(107,15,26,0.2) 0%, rgba(138,18,40,0) 50%);
        }
        .splash-glass {
          background: rgba(138,18,40,0.2);
          backdrop-filter: blur(12px);
        }
      `}</style>

      {/* overflow-hidden h-screen w-full flex */}
      <main
        className="relative h-screen w-full flex flex-col md:flex-row items-stretch overflow-hidden"
        style={{ fontFamily: 'Inter, sans-serif', backgroundColor: '#8A1228', color: '#fff' }}
      >

        {/* ══════════════════════════════════════════════════════
            LEFT — Branding & Visual Anchor
        ══════════════════════════════════════════════════════ */}
        <section
          className="relative w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 overflow-hidden"
          style={{ backgroundColor: '#8A1228' }}
        >
          {/* Radial hero gradient overlay */}
          <div
            className="absolute inset-0 splash-hero-gradient pointer-events-none"
            style={{ opacity: 0.4 }}
          />

          {/* Paper texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: 0.1,
              mixBlendMode: 'overlay',
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDMysqO4LX3S5_mI_HsOdjkQJD1rql-E2ikHbK0oBrAkzswmQ6Dzngpmr8X46HZ8iEsIEuhMbHmO93VpPVFA4YaZ0vMaDvp_g_h0XJinRtMI1gsN2n2FvDexpQpdgOIJE0gZfK_lvYKe475jd0AjzTYSIKyssaDGR7Dt5FxBMHye6iba2nzEfuzBEgGn16hROUWGO2Km5Z4adAePnX9wUKHNz-e-0sq0m-B2Wd7tGrAKc0bc4k5q-L-xgyzLwcNe5RwrOY_lgVGBlU')",
            }}
          />

          {/* Content */}
          <div
            className="relative z-10 flex flex-col items-center md:items-start max-w-lg text-center md:text-left"
            style={{ gap: '2rem' }}
          >
            {/* Logo */}
            <div
              className="flex items-center justify-center shadow-2xl"
              style={{
                width: 96, height: 96,
                backgroundColor: '#ffffff',
                borderRadius: '0.75rem',
                padding: 16,
              }}
            >
              <img
                src="/iuea_logo.png"
                alt="IUEA Library Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Headline + tagline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h1
                style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                  lineHeight: 1.1,
                }}
              >
                IUEA Library
              </h1>
              <p
                style={{
                  fontFamily: 'Playfair Display, Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(1rem, 1.8vw, 1.5rem)',
                  color: '#D9B96B',
                  opacity: 0.9,
                  lineHeight: 1.5,
                }}
              >
                Your knowledge. Unlimited access.
              </p>
            </div>

            {/* Gold divider */}
            <div
              className="hidden md:block rounded-full"
              style={{ height: 4, width: 96, backgroundColor: '#B8964A' }}
            />

            {/* Body text */}
            <p
              style={{
                color: '#ffdad9',
                fontSize: '1.0625rem',
                fontWeight: 300,
                lineHeight: 1.7,
                maxWidth: 320,
              }}
            >
              Step into the digital future of academia. Curated collections,
              research archives, and global literature at your fingertips.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            RIGHT — Interaction & Action
        ══════════════════════════════════════════════════════ */}
        <section
          className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 md:p-16 relative overflow-hidden"
          style={{ backgroundColor: '#5C0F1F' }}
        >
          <div className="w-full flex flex-col" style={{ maxWidth: 448, gap: '3rem' }}>

            {/* Library photo card */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl group"
              style={{ aspectRatio: '4/3' }}
            >
              {/* Dark gradient over image */}
              <div
                className="absolute inset-0 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(138,18,40,0.8) 0%, transparent 55%)' }}
              />

              {/* Library photo */}
              <img
                src={LIBRARY_IMG}
                alt="Library Interior"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Bottom overlay content */}
              <div className="absolute bottom-6 left-6 z-20">
                <span
                  className="inline-block font-bold uppercase"
                  style={{
                    backgroundColor: '#B8964A',
                    color: '#503d00',
                    fontSize: '10px',
                    letterSpacing: '0.15em',
                    padding: '4px 12px',
                    borderRadius: 9999,
                  }}
                >
                  Featured Archive
                </span>
                <h3
                  style={{
                    fontFamily: 'Playfair Display, Georgia, serif',
                    color: '#ffffff',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  The Digital Curator
                </h3>
              </div>
            </div>

            {/* Action block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Get Started button */}
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-3 font-bold active:scale-95 group"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#8A1228',
                  padding: '1.25rem 2rem',
                  borderRadius: '0.5rem',
                  fontSize: '1.0625rem',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FCE8E6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                Get Started
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1" style={{ fontSize: 22 }}>
                  arrow_forward
                </span>
              </button>

              {/* Secondary links */}
              <div
                className="flex items-center justify-between"
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffb3b3',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                <Link
                  to="/admin"
                  className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>admin_panel_settings</span>
                  Admin Portal
                </Link>
                <Link
                  to="/login"
                  className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                  Faculty Login
                </Link>
              </div>
            </div>
          </div>

          {/* Floating blur decoration */}
          <div
            className="absolute pointer-events-none rounded-full blur-3xl"
            style={{
              bottom: -64, right: -64,
              width: 256, height: 256,
              backgroundColor: '#755b00',
              opacity: 0.1,
            }}
          />
        </section>
      </main>

      {/* ── Fixed footer ─────────────────────────────────────────── */}
      <footer
        className="fixed bottom-0 left-0 w-full z-50 pointer-events-none"
        style={{ padding: '1.5rem' }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full max-w-7xl mx-auto">

          {/* Language selector */}
          <div
            className="pointer-events-auto flex items-center gap-3 splash-glass border rounded-full"
            style={{ padding: '8px 16px', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }}>
              language
            </span>
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="bg-transparent border-none text-white text-xs cursor-pointer focus:outline-none focus:ring-0"
              style={{ fontFamily: 'Inter, sans-serif', padding: 0, paddingRight: 20 }}
            >
              <option style={{ backgroundColor: '#8A1228' }} value="en">English (US)</option>
              <option style={{ backgroundColor: '#8A1228' }} value="fr">Français</option>
              <option style={{ backgroundColor: '#8A1228' }} value="sw">Kiswahili</option>
              <option style={{ backgroundColor: '#8A1228' }} value="ar">العربية</option>
            </select>
          </div>

          {/* Google Translate */}
          <div
            className="pointer-events-auto flex items-center gap-3 splash-glass border rounded-full"
            style={{ padding: '8px 16px', borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#ffb3b3',
              }}
            >
              Powered by Google Translate
            </span>
            <div
              className="flex items-center justify-center overflow-hidden rounded-full"
              style={{ width: 16, height: 16, backgroundColor: '#ffffff', padding: 2 }}
            >
              <svg viewBox="0 0 24 24" className="w-full h-full">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Decorative "IUEA" corner watermark ───────────────────── */}
      <div
        className="fixed top-0 right-0 z-0 pointer-events-none overflow-hidden"
        style={{ padding: 32, opacity: 0.2 }}
      >
        <span
          style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '12vw',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1,
            userSelect: 'none',
            display: 'block',
            marginRight: '-5rem',
            marginTop: '-2.5rem',
          }}
        >
          IUEA
        </span>
      </div>
    </>
  );
}
