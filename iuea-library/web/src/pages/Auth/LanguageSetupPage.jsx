import { useState }    from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore    from '../../store/authStore';
import api             from '../../services/api';

const LANGUAGES = [
  {
    code: 'en', name: 'English',     native: 'Standard English',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMcpWN_2nSlmFssMiOfHkhVw1OU17RdGrWJm9FZeGzx94cgpwUjjRTBsRB3jx9guMkm6MxT-kG1bYm8tRRWwIgnirAW9qThDSla4emyUDpxdKCH6z6mvsmyXFgPn3ZM5XedsWVw69q67T47JvPJmbSPQCavjV9hALskrJitakc-Cini91v-JmuX2oM1itZduIlD_tF04aAodrrYCQFAuFNaddUYyDBL_DaTDJJ82mIDpVeKp6SLn_OHdiKo81mJsbCHYYAXvi-qIo',
  },
  {
    code: 'sw', name: 'Swahili',     native: 'Kiswahili',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDijzkNob3Gpf1OWesmVp-8cDXa3-ecWkofJfhSWM5InNw94bxAzqWZkO3qPBsJjic2xN9kjgcJ4TORf4eaDF4f0zx7SHSbbw-tLIen7i2KZo6PB5KQ278JnQI7pxkA2tB9WEvwKXG3ESU2K3uOI4cpaymWBSVv0HAjUUC6Ayh4JENSJh3B_qlIJfi8FxXdgGRKz4IiYK9yogSRVlwVOuZg7iNJpxO49DFgVP89UpxF96f_WZPXnpg4xdkjPFW7Ap8c1vPr4GPkTsM',
  },
  {
    code: 'fr', name: 'French',      native: 'Français',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBXlHwMOwku9TxnuIsAdMfCw6PdUlr9N5wydUsACwFnxZKuDkXZr8BiR6KEwKV2DRQBSDiRV6H5Fto1xxvUtN2XAAggn9dbNPNzk1MLNi5acMjRWCVNGxZRpbb5ru3EjXKIWi_2jcuae-ZGGeArCwlzbbWpowO-CKwY5VtZnHOKy4_-IGMRublk8zM4AimIfjfJkbNgEetszF4T8fQNiz69UOmdDpNG7m01Mrdflp3w2Fz8s_kkmZg7npZeULQo3O0BuFV7EmRenZw',
  },
  {
    code: 'ar', name: 'Arabic',      native: 'العربية',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCi5oAMrt5fuMGGMnyd3UKJi5SN_CMoSCIBjPVtglPutDEC7j4gqpbE4tMU3qXIqTBwlrN8lULDMV685a6EVGKXId_07082gFP-C1DUaSmdntkPvukRNQgL8PZ1gaHOQcT0tjINO6Y1-g5Q3wEEE-NA1Is9AmrLxTuv9Y3OPDzMKNLCZ4cvVOIbCQFwunwXXJN0Pbr4XSOtQz7TJZdjIDjI_5NJrkVbcZQVQk8dYOndUxAhhzsUSXUtFfnfGbkk5mwrldR8FSh0z2A',
  },
  {
    code: 'lg', name: 'Luganda',     native: 'Oluganda',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbrJVRKTv1FB5tN8jZ-b9p-6DK_xf9o80lADd1rrHu4BI834gX_csSOqOiK_aekt6KjUNRO_jvMJCF4YrO3uIao40ZMjWkvhBF13ehxz2HlDkWcKsq4sW-dX77AQkhDI1-WiWCQu63wtg1K4AUjXrAITslr6q8qUbdZPim3L-i2l81DY9-DxF2-k8rPufSZW7cFtSikcYGDRlQkLnpFjXlK01UtKSjc_4D2IRmjnx6MLQ4-Cj1792P5cEbW2AQrt62AxcTAvmOivI',
  },
  {
    code: 'rw', name: 'Kinyarwanda', native: 'Ikinyarwanda',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmPi6XZwic_lyTObpBoo_aDGepQ7rfg3NfhqGvicS-Nsykni9WxaZQwM7HBxNLs59wl2uTEFRF3urWO4A9Z-26KSfGugg6ow8-guVbG3FpF4yqaLBD1GthiaX9PQytpckhlyGnXEjhFcU5m4nWK1FyKI3C5xAWp6GkG5BqULkOwRPer93L-KzYMeAewGyYtd4GUrdF0HqaPPiVmfZ-CLAutajMTjI1DlinAcMymdJaiyVvnwfy3TEf5Uj-NNu-SlgnSJoJWeQNcss',
  },
  {
    code: 'so', name: 'Somali',      native: 'Af-Soomaali',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAm9T6tHuqdDEReirSQVwsfxb6j9BLkHsahY1ZBPcz62IF5YTUGj0LmNzjc6icw1Jx5CBKmKXqYbbnY2e-7VcNgvDM-ehvl2dzYjNpwN64AIP0dbsFe3Lcof4CobcUtRIPZPo-ThamXCww_DnX8nZWndg2_ONbWHdhEepXdMSBNSs74b2mRsPoReSOWkTngHuBRoRU1qmEFWmOb2GvvWlHQE12szH1IiCs9h130qBoHSinuRwTcexmfX6X7M0jytmPfQuY1a4meuwk',
  },
  {
    code: 'am', name: 'Amharic',     native: 'አማርኛ',
    flagUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDc95k2UBnlQuYSIluW3StFM_OgMChVdcz-Hhl7xmofLFnGz-557jv-VYkzE15c8bC0b36wO54rYJWCX2EIG7inwrohrrr6syQ-wV2jppUjbAuPg9UZUMKq3CJmTO5MihpXzNfp2nfxybqT6UoVdAnVhDzvGeXDjNa8mnSKzR_yxvqeZsBHvFqdPW7G39V2j5CRku79cNR6yV1kew12ABUcJkUVZM9eamVySmZ2QQNfXKK1EVhgql3tQcVYfGSbxcOf6izAOcz77nE',
  },
];

export default function LanguageSetupPage() {
  const navigate = useNavigate();
  useAuthStore();

  const [selected, setSelected] = useState(['en', 'ar']);
  const [saving,   setSaving]   = useState(false);

  const toggle = (code) => {
    setSelected(prev =>
      prev.includes(code)
        ? prev.length > 1 ? prev.filter(c => c !== code) : prev
        : [...prev, code]
    );
  };

  const onContinue = async () => {
    setSaving(true);
    try {
      await api.put('/auth/me', { preferredLanguages: selected });
    } catch {
      // non-fatal
    }
    setSaving(false);
    navigate('/home');
  };

  return (
    <>
      <style>{`
        .ls-shell {
          background: #FCE8E6;
          color: #1C0A0C;
          font-family: Inter, sans-serif;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .ls-header {
          position: sticky;
          top: 0;
          width: 100%;
          z-index: 40;
          height: 64px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
          background: #FCE8E6;
        }
        .ls-curator-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.5rem;
        }
        .ls-card-selected {
          background: #ffffff;
          border-radius: 0.75rem;
          padding: 1.5rem;
          position: relative;
          box-shadow: 0 12px 40px rgba(74,8,16,0.06);
          ring: 2px solid #5C0F1F;
          outline: 2px solid #5C0F1F;
          cursor: pointer;
          transition: all 0.3s;
        }
        .ls-card {
          background: #FCE8E6;
          border-radius: 0.75rem;
          padding: 1.5rem;
          position: relative;
          outline: 1px solid #EBD2CF;
          cursor: pointer;
          transition: all 0.3s;
        }
        .ls-card:hover {
          background: #ffffff;
          outline: 1px solid rgba(107,15,26,0.3);
        }
        .ls-flag-box {
          height: 48px;
          width: 64px;
          margin-bottom: 1rem;
          overflow: hidden;
          border-radius: 0.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          background: #ffd9dc;
        }
        .ls-flag-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ls-continue-btn {
          background: #5C0F1F;
          color: #fff;
          padding: 1rem 3rem;
          border-radius: 0.5rem;
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 1.125rem;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 4px 20px rgba(107,15,26,0.3);
          transition: background 0.2s, transform 0.1s;
        }
        .ls-continue-btn:hover:not(:disabled) { background: #8A1228; }
        .ls-continue-btn:active { transform: scale(0.95); }
        .ls-continue-btn:disabled { opacity: 0.6; cursor: default; }
        .ls-skip-btn {
          background: none;
          border: none;
          color: #984447;
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          padding: 0.5rem 1rem;
          text-decoration: none;
        }
        .ls-skip-btn:hover { text-decoration: underline; text-decoration-color: #B8964A; text-decoration-thickness: 2px; }
        .ls-footer {
          width: 100%;
          padding: 2rem;
          margin-top: auto;
          background: #FCE8E6;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .ls-footer-links {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .ls-footer-link {
          font-family: Inter, sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(138,18,40,0.4);
          text-decoration: none;
          transition: color 0.2s;
        }
        .ls-footer-link:hover { color: #5C0F1F; }
        .ls-footer-powered {
          font-family: Inter, sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(138,18,40,0.5);
        }
        .ls-heading-block { text-align: center; }
        .ls-heading-subtitle { justify-content: center; }
        @media (min-width: 768px) {
          .ls-heading-block { text-align: left !important; }
          .ls-heading-subtitle { justify-content: flex-start !important; }
        }
      `}</style>

      <div className="ls-shell">

        {/* ── Header ── */}
        <header className="ls-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/iuea_logo.png" alt="IUEA Logo"
              style={{ height: 40, width: 40, objectFit: 'contain' }} />
            <span style={{
              fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700,
              fontSize: '1.125rem', color: '#8A1228',
            }}>
              IUEA Library
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(136,0,30,0.6)', padding: 8 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#5C0F1F')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(136,0,30,0.6)')}>
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(136,0,30,0.6)', padding: 8 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#5C0F1F')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(136,0,30,0.6)')}>
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </header>

        {/* ── Main ── */}
        <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
          <div style={{ maxWidth: '72rem', width: '100%' }}>

            {/* Heading */}
            <div className="ls-heading-block" style={{ marginBottom: '3rem' }}>
              <h1 style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                fontWeight: 800, color: '#8A1228',
                letterSpacing: '-0.02em', lineHeight: 1.15,
                marginBottom: '1rem',
              }}>
                Choose your reading languages
              </h1>
              <p className="ls-heading-subtitle" style={{ fontSize: '1.125rem', color: '#984447', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>translate</span>
                Powered by Google Translate
              </p>
            </div>

            {/* Language Grid */}
            <div className="ls-curator-grid" style={{ marginBottom: '4rem' }}>
              {LANGUAGES.map(({ code, name, native, flagUrl }) => {
                const isSelected = selected.includes(code);
                return (
                  <div
                    key={code}
                    className={isSelected ? 'ls-card-selected' : 'ls-card'}
                    onClick={() => toggle(code)}
                  >
                    {isSelected && (
                      <div style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#5C0F1F' }}>
                        <span className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      </div>
                    )}
                    <div className="ls-flag-box">
                      <img src={flagUrl} alt={`${name} flag`} />
                    </div>
                    <h3 style={{
                      fontFamily: 'Playfair Display, Georgia, serif',
                      fontSize: '1.5rem', fontWeight: 700,
                      color: '#8A1228',
                    }}>
                      {name}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>
                      {native}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Bottom bar */}
            <div style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center',
              justifyContent: 'space-between', gap: '2rem',
              paddingTop: '2rem', borderTop: '1px solid #ffd9dc',
              flexWrap: 'wrap',
            }}>
              <div style={{ color: '#6B5456', maxWidth: '28rem' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontStyle: 'italic' }}>
                  "The language of the soul is found in the literature of one's own heritage.
                  Choose the tongues that speak best to your curiosity."
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <button className="ls-skip-btn" onClick={() => navigate('/home')}>
                  Skip for now
                </button>
                <button className="ls-continue-btn" onClick={onContinue} disabled={saving}>
                  {saving ? 'Saving…' : 'Continue'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* ── Footer ── */}
        <footer className="ls-footer">
          <div className="ls-footer-links">
            {['Privacy', 'Terms', 'Translate', 'Books API'].map(t => (
              <a key={t} href="#" className="ls-footer-link">{t}</a>
            ))}
          </div>
          <p className="ls-footer-powered">Powered by Google</p>
        </footer>

      </div>
    </>
  );
}
