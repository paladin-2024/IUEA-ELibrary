import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams }                          from 'react-router-dom';
import useBookStore from '../../store/bookStore';
import BookCard     from '../../components/ui/BookCard';

const ALL_CATEGORIES = [
  { label: 'Law',                    icon: 'gavel'              },
  { label: 'Science',                icon: 'biotech'            },
  { label: 'Technology',             icon: 'laptop_mac'         },
  { label: 'Computer Science',       icon: 'terminal'           },
  { label: 'Business',               icon: 'business_center'    },
  { label: 'Engineering',            icon: 'engineering'        },
  { label: 'Petroleum Engineering',  icon: 'local_gas_station'  },
  { label: 'Civil Engineering',      icon: 'foundation'         },
  { label: 'Politics',               icon: 'account_balance'    },
  { label: 'Medicine',               icon: 'medical_services'   },
  { label: 'Education',              icon: 'school'             },
  { label: 'Economics',              icon: 'trending_up'        },
  { label: 'Mathematics',            icon: 'functions'          },
  { label: 'Philosophy',             icon: 'psychology'         },
  { label: 'Literature',             icon: 'menu_book'          },
  { label: 'Social Sciences',        icon: 'groups'             },
  { label: 'Arts',                   icon: 'palette'            },
  { label: 'History',                icon: 'history_edu'        },
];

const ALL_LANGUAGES = ['English', 'French', 'Swahili', 'Arabic', 'Portuguese', 'Spanish'];
const ALL_FORMATS   = ['epub', 'pdf'];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query,       setQuery]        = useState(searchParams.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') ?? '');
  const [activeLanguage,  setActiveLanguage]  = useState(searchParams.get('language') ?? '');
  const [activeFormat,    setActiveFormat]    = useState('');
  const [langOpen,        setLangOpen]        = useState(false);
  const langRef = useRef(null);

  const { searchBooks, searchResults, externalResults, searchLoading } = useBookStore();
  const isLoading = searchLoading;

  const buildFilters = (cat = activeCategory, lang = activeLanguage) => {
    const f = {};
    if (cat)  f.category = cat;
    if (lang) f.language = lang;
    return f;
  };

  const doSearch = useCallback((q, cat = activeCategory, lang = activeLanguage) => {
    const term = q.trim() || cat || lang || 'education university academic';
    searchBooks(term, buildFilters(cat, lang));
  }, [searchBooks, activeCategory, activeLanguage]);

  useEffect(() => {
    const q   = searchParams.get('q')        ?? '';
    const cat = searchParams.get('category') ?? '';
    const lang = searchParams.get('language') ?? '';
    setQuery(q);
    setActiveCategory(cat);
    setActiveLanguage(lang);
    doSearch(q || 'education university academic', cat, lang);
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (query)          params.q        = query;
    if (activeCategory) params.category = activeCategory;
    if (activeLanguage) params.language = activeLanguage;
    setSearchParams(params);
    doSearch(query, activeCategory, activeLanguage);
  };

  const selectCategory = (cat) => {
    const next = cat === activeCategory ? '' : cat;
    setActiveCategory(next);
    const params = {};
    if (query) params.q = query;
    if (next)  params.category = next;
    if (activeLanguage) params.language = activeLanguage;
    setSearchParams(params);
    doSearch(query, next, activeLanguage);
  };

  const selectLanguage = (lang) => {
    const next = lang === activeLanguage ? '' : lang;
    setActiveLanguage(next);
    setLangOpen(false);
    const params = {};
    if (query) params.q = query;
    if (activeCategory) params.category = activeCategory;
    if (next) params.language = next;
    setSearchParams(params);
    doSearch(query, activeCategory, next);
  };

  const clearAll = () => {
    setActiveCategory('');
    setActiveLanguage('');
    setActiveFormat('');
    setSearchParams(query ? { q: query } : {});
    doSearch(query, '', '');
  };

  const allBooks     = [...(searchResults ?? []), ...(externalResults ?? [])];
  const displayBooks = allBooks;

  return (
    <>
      <style>{`
        /* Topbar */
        .sp-topbar {
          position: sticky; top: 0; width: 100%; z-index: 40;
          height: 80px; background: #FCE8E6;
          display: flex; align-items: center;
          padding: 0 2rem; gap: 2rem;
        }
        /* Search pill */
        .sp-search-pill {
          flex: 1; max-width: 48rem;
          display: flex; align-items: center;
          background: #ffffff; border-radius: 9999px;
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(223,191,190,0.2);
          transition: box-shadow 0.2s;
        }
        .sp-search-pill:focus-within { box-shadow: 0 0 0 2px rgba(107,15,26,0.2); }
        .sp-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: #1C0A0C; font-family: Inter, sans-serif; font-size: 0.9375rem;
          padding: 0 1rem;
        }
        .sp-search-input::placeholder { color: rgba(88,65,65,0.5); }
        /* Filter pills */
        .sp-filter-pill {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.625rem 1.25rem; border-radius: 9999px;
          border: 1px solid rgba(223,191,190,0.15);
          background: #ffffff; color: #8A1228;
          font-family: Inter, sans-serif; font-size: 0.875rem; font-weight: 500;
          cursor: pointer; transition: background 0.2s, color 0.2s;
          white-space: nowrap;
        }
        .sp-filter-pill:hover { background: #5C0F1F; color: #ffffff; }
        /* Book grid */
        .sp-grid {
          display: grid; gap: 2rem;
          grid-template-columns: repeat(1, 1fr);
        }
        @media (min-width: 640px)  { .sp-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 768px)  { .sp-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .sp-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1280px) { .sp-grid { grid-template-columns: repeat(5, 1fr); } }
        /* Book card */
        .sp-card {
          display: flex; flex-direction: column; gap: 1rem; cursor: pointer;
        }
        .sp-card-cover {
          aspect-ratio: 3/4; background: #ffffff;
          border-radius: 0.75rem; overflow: hidden; position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .sp-card:hover .sp-card-cover {
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
          transform: translateY(-4px);
        }
        .sp-card-cover img { width: 100%; height: 100%; object-fit: cover; }
        .sp-preview-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.4); backdrop-filter: blur(2px);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .sp-card:hover .sp-preview-overlay { opacity: 1; }
        /* Card metadata */
        .sp-meta {
          display: flex; flex-direction: column; gap: 0.25rem;
        }
      `}</style>

      {/* ── Topbar ── */}
      <header className="sp-topbar">
        <form className="sp-search-pill" onSubmit={handleSubmit}>
          <span className="material-symbols-outlined" style={{ color: '#6B5456' }}>search</span>
          <input
            className="sp-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
          />
          <button type="button" style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: '#5C0F1F' }}>mic</span>
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
          <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FDF4F2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
            <span className="material-symbols-outlined" style={{ color: '#8A1228' }}>notifications</span>
          </button>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#5C0F1F', border: '2px solid rgba(107,15,26,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span className="material-symbols-outlined" style={{ color:'#fff', fontSize:'1.25rem' }}>person</span>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '3rem', fontWeight: 700, color: '#8A1228', letterSpacing: '-0.02em', margin: 0 }}>
            Library Archive
          </h2>
          <p style={{ fontFamily: 'Lora, serif', fontStyle: 'italic', color: '#6B5456', fontSize: '1.125rem', maxWidth: '42rem', margin: 0 }}>
            "The only thing that you absolutely have to know, is the location of the library." — Albert Einstein
          </p>
        </div>

        {/* ── Filter bar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Row 1: Language dropdown + Format pills + Clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>

            {/* Language dropdown */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setLangOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 1rem', borderRadius: 9999, cursor: 'pointer',
                  border: activeLanguage ? '1px solid #5C0F1F' : '1px solid rgba(223,191,190,0.4)',
                  background: activeLanguage ? '#5C0F1F' : '#ffffff',
                  color: activeLanguage ? '#fff' : '#8A1228',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>language</span>
                <span>{activeLanguage || 'Language'}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                  {langOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {langOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  background: '#fff', borderRadius: 12, zIndex: 50, minWidth: 160,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
                  border: '1px solid rgba(223,191,190,0.3)',
                  overflow: 'hidden',
                }}>
                  {ALL_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => selectLanguage(lang)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '0.625rem 1rem', border: 'none', cursor: 'pointer',
                        background: activeLanguage === lang ? '#FDF4F2' : 'transparent',
                        color: activeLanguage === lang ? '#5C0F1F' : '#1C0A0C',
                        fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
                        fontWeight: activeLanguage === lang ? 700 : 400,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (activeLanguage !== lang) e.currentTarget.style.background = '#FDF4F2'; }}
                      onMouseLeave={e => { if (activeLanguage !== lang) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Format pills */}
            {ALL_FORMATS.map((fmt) => (
              <button
                key={fmt}
                onClick={() => setActiveFormat(f => f === fmt ? '' : fmt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 1rem', borderRadius: 9999, cursor: 'pointer',
                  border: activeFormat === fmt ? '1px solid #5C0F1F' : '1px solid rgba(223,191,190,0.4)',
                  background: activeFormat === fmt ? '#5C0F1F' : '#ffffff',
                  color: activeFormat === fmt ? '#fff' : '#8A1228',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
                  transition: 'all 0.15s',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
                  {fmt === 'epub' ? 'chrome_reader_mode' : 'picture_as_pdf'}
                </span>
                <span style={{ textTransform: 'uppercase' }}>{fmt}</span>
              </button>
            ))}

            {/* Active filter summary + clear */}
            {(activeCategory || activeLanguage || activeFormat) && (
              <>
                <div style={{ height: 20, width: 1, background: 'rgba(223,191,190,0.4)' }} />
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
                }}>
                  {[activeCategory, activeLanguage, activeFormat].filter(Boolean).map((f) => (
                    <span key={f} style={{
                      display: 'flex', alignItems: 'center', gap: '0.375rem',
                      padding: '0.25rem 0.625rem', background: '#FDF4F2',
                      border: '1px solid #EBD2CF', borderRadius: 9999,
                      fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#5C0F1F', fontWeight: 600,
                    }}>
                      {f}
                    </span>
                  ))}
                  <button onClick={clearAll} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#A89597', fontFamily: 'Inter, sans-serif',
                    fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>close</span>
                    Clear all
                  </button>
                </div>
              </>
            )}

            <span style={{
              marginLeft: 'auto', fontFamily: 'Inter, sans-serif',
              fontSize: '0.75rem', color: '#A89597',
            }}>
              {displayBooks.length} result{displayBooks.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Row 2: Category chips — horizontally scrollable */}
          <div style={{
            display: 'flex', gap: '0.5rem',
            overflowX: 'auto', paddingBottom: '0.5rem',
            scrollbarWidth: 'none',
          }}>
            <style>{`.sp-cat-scroll::-webkit-scrollbar{display:none}`}</style>
            {ALL_CATEGORIES.map(({ label, icon }) => {
              const active = activeCategory === label;
              return (
                <button
                  key={label}
                  onClick={() => selectCategory(label)}
                  style={{
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '0.375rem',
                    padding: '0.5rem 1rem', borderRadius: 9999, cursor: 'pointer',
                    border: active ? '1px solid #5C0F1F' : '1px solid rgba(223,191,190,0.4)',
                    background: active ? '#5C0F1F' : '#ffffff',
                    color: active ? '#ffffff' : '#3E2B2E',
                    fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', fontWeight: active ? 700 : 500,
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#FDF4F2'; e.currentTarget.style.borderColor = '#D9B4B0'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = 'rgba(223,191,190,0.4)'; } }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Book grid */}
        {isLoading ? (
          <div className="sp-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                <div style={{ aspectRatio:'3/4', borderRadius:'0.75rem', background:'linear-gradient(90deg,#FDF4F2 25%,#ffe1e3 50%,#FDF4F2 75%)', backgroundSize:'200% 100%', animation:'sp-shimmer 1.4s infinite' }} />
                <style>{`@keyframes sp-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
                <div style={{ height:14, borderRadius:4, background:'#FDF4F2' }} />
                <div style={{ height:11, width:'60%', borderRadius:4, background:'#FDF4F2' }} />
              </div>
            ))}
          </div>
        ) : displayBooks.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'#A89597', fontFamily:'Inter, sans-serif' }}>
            <span className="material-symbols-outlined" style={{ fontSize:56, color:'#EBD2CF', display:'block', marginBottom:12 }}>search</span>
            No results found. Try a different search term.
          </div>
        ) : (
          <div className="sp-grid">
            {displayBooks.map((book, i) => (
              <BookCard key={book._id ?? book.id ?? i} book={book} variant="portrait" />
            ))}
          </div>
        )}

        {/* Load More */}
        {displayBooks.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
            <button style={{
              padding: '0.75rem 2rem', background: '#5C0F1F', color: '#fff',
              borderRadius: 9999, fontFamily: 'Inter, sans-serif', fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(107,15,26,0.3)',
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              transition: 'transform 0.2s',
            }}
              onClick={() => {
                const nextPage = (parseInt(searchParams.get('page') || '1')) + 1;
                setSearchParams(p => { const n = new URLSearchParams(p); n.set('page', nextPage); return n; });
                doSearch(query);
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              <span>Load More Results</span>
              <span className="material-symbols-outlined">keyboard_double_arrow_down</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <footer style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(223,191,190,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms', 'Translate', 'Books API'].map(t => (
              <a key={t} href="#" style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(138,18,40,0.4)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#5C0F1F')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(138,18,40,0.4)')}>
                {t}
              </a>
            ))}
          </div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(138,18,40,0.5)' }}>
            Powered by Google
          </span>
        </footer>
      </div>
    </>
  );
}
