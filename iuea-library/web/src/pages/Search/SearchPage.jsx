import { useState, useEffect, useCallback } from 'react';
import { useSearchParams }                  from 'react-router-dom';
import useBookStore from '../../store/bookStore';
import BookCard     from '../../components/ui/BookCard';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query,        setQuery]        = useState(searchParams.get('q') ?? '');
  const [activeFilter, setActiveFilter] = useState('');

  const { searchBooks, searchResults, externalResults, searchLoading } = useBookStore();
  const isLoading = searchLoading;

  const doSearch = useCallback((q) => { if (q.trim()) searchBooks(q.trim()); }, [searchBooks]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setQuery(q); doSearch(q); }
    else   { doSearch('education africa university academic'); }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
    doSearch(query);
  };

  const allBooks    = [...(searchResults ?? []), ...(externalResults ?? [])];
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

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          {[
            { icon: 'category',    label: 'Categories', param: 'category', values: ['Law','Economics','IT','Science','Medicine','Business','Education','Social Sciences'] },
            { icon: 'language',    label: 'Languages',  param: 'language', values: ['English','French','Swahili','Arabic'] },
            { icon: 'description', label: 'Formats',    param: 'format',   values: ['epub','pdf','external'] },
          ].map(({ icon, label, param, values }) => (
            <div key={label} style={{ position: 'relative' }}>
              <button className="sp-filter-pill"
                onClick={() => {
                  const val = values[0];
                  setSearchParams(p => { const n = new URLSearchParams(p); n.set(param, val); return n; });
                  setActiveFilter(val);
                  doSearch(query || val);
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>{icon}</span>
                <span>{label}</span>
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>expand_more</span>
              </button>
            </div>
          ))}

          {/* Faculty Picks — gold tint */}
          <button style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.25rem', borderRadius: 9999,
            border: '1px solid rgba(201,168,76,0.3)',
            background: 'rgba(201,168,76,0.1)', color: '#755b00',
            fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }} onClick={() => { setSearchParams({ faculty: 'Law' }); setActiveFilter('Faculty Picks'); doSearch('Law'); }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>school</span>
            <span>Faculty Picks</span>
          </button>

          {/* Divider */}
          <div style={{ height: 24, width: 1, background: 'rgba(223,191,190,0.3)', margin: '0 0.5rem' }} />

          {/* Active chip */}
          {activeFilter && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#5C0F1F', color: '#fff', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              <span>{activeFilter}</span>
              <button onClick={() => setActiveFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, color: '#fff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
              </button>
            </div>
          )}

          <button onClick={() => setActiveFilter('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#5C0F1F', fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Clear All Filters
          </button>
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
