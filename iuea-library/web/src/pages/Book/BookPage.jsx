import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBook, useSimilarBooks } from '../../hooks/useBooks';

/* ── Static fallback similar books ──────────────────────────────────────── */
const STATIC_SIMILAR = [
  {
    _id: 's1',
    title: 'How to Stop Time',
    author: 'Matt Haig',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAAw2Ci5LOgstY-xkT3-OIePlrvKMbbGIeW1ErCMOOKtpXFvvVruOpwjMHoRHbQXacUGHxuPBwDUhJ90OK22IWFWnk58vjuigvdHl2zSUvDiwfkGXyBR0JmMRL7KAc_skuzH_jqTxQ0b50PkIlyps-uvxdwUZcXO2WLdTo61DIwgyynhLt95kect-Zh9Mp9uLVuQckIfNPyurVl5lurtwKNKd1HApQad_qEhlQjLsiOeG5LeTgLaiBheUbhYlFHG7UCpddZpR3qXX4',
  },
  {
    _id: 's2',
    title: 'Reasons to Stay Alive',
    author: 'Matt Haig',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAsVc__frcc0_OYnf9NhWR9Etz9DMBYO13-nIuFybHqGCOjh3Ib7LE2VAilV5KQuAl35gobS9Qd957VwI3YJKMzPg5L70nET47t3Ys-Naa9Upv-dZ8xvwFLBHAkQL_cBf5c-5PR0j-ESr7-2RrBkz-Yvso05mep36hHt7rAOPD6N-M6DfaBpPNiymDStb-iYAHbBADKYqMGo58sXKuLDR8MGothOFl9hXe9_HZYcC4axl6-uAYDKBD2TZRGFd2FFpP0bhrkDGGTnwA',
  },
  {
    _id: 's3',
    title: 'Notes on a Nervous P...',
    author: 'Matt Haig',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC7CAyFQwqJOOrYXttEOCyirbpipmq-hNAf-lhSlc4CbCHyCGqJmj8A995kbjEhSHzIKef3SRdSp7r8GcciBK6WPiZ1nEHyvNVm-XZkaE4PXKLzAQy_BRg2ToYW6CRkMhL07UCJAWeN3018TCdrP_fzTyrjbHu4_8_H-g6VaYVBlfiE0o-0m91OPNFOdEpm53dEZ60wmnwEPdaJ-7umlsSNSzRTODzsnXTapo3uDcwOWsG4QSBVuJbuA_BhNv2YCokRKU5LQIURTI',
  },
  {
    _id: 's4',
    title: 'The Humans',
    author: 'Matt Haig',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJIPU9NNReqp1qeUrii08gtaozQKz-sYzs8fwmLiedJIkyyRN2p162-3Vuyo-8Pg35Kc9pmgVPUUOWF-9ID_chGk53_MJcF8mR5ucRcKWsau7RBNGS6SWt5C6rUspdI8xwj4Y3eu2qU0XWD-3Wd0N2XADvRh1FPFIxOOYuPWehus2vO7xJ5naAeGepNCnN6UaaSASj8XUvfdoGGokreiFN5gUfT1Tq0FOGIrxtomJWRBcw12Tu7h5QvR4_54kHYSTNfKDYa2qZhq0',
  },
];

export default function BookPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [search, setSearch] = useState('');
  const [saved,  setSaved]  = useState(false);

  const { data, isLoading } = useBook(id);
  const { data: simData }   = useSimilarBooks(id);

  const book    = data?.book;
  const similar = simData?.books?.length > 0 ? simData.books.slice(0, 4) : STATIC_SIMILAR;

  /* Derived display values */
  const title     = book?.title       ?? 'The Midnight Library';
  const author    = book?.author
    ? (Array.isArray(book.author) ? book.author[0] : book.author)
    : 'Matt Haig';
  const category  = book?.category    ?? 'Historical Fiction';
  const publisher = book?.publisher   ?? 'Viking Penguin';
  const language  = book?.language    ?? 'English';
  const pageCount = book?.pageCount   ?? 304;
  const coverUrl  = book?.coverUrl    ?? 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCCTQcka8MKWEt6Jrq2LUfS_Un2LJ3vWeSjMyaLGeH6ft1nf5OA3-tOR7PvwgVgG9v7unEjkgeQ9Q1r93AdUPjoFlbe2Wpp94BLzn8YUQbIeTzDHArOAwUygSgG11ErJFt9iyTnyWFqkw6U2JYUyAYXIYV-lqcHvXF7R_1q8KzYIh_0VZFPmIzE1cmEU1RIWN5EXSVtDYjv-nUmIYJTRFborUHOfPrSr8W9s5IQOnqosc62fjwVkKisUagfWw8Cybb7FkrHHIGVg4';

  const genres    = book?.genres?.length > 0
    ? book.genres
    : ['Fiction', 'Contemporary', 'Fantasy'];

  const description1 = book?.description
    ? book.description.slice(0, Math.floor(book.description.length / 2))
    : 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived. To see how things would be if you had made other choices...';

  const description2 = book?.description && book.description.length > 200
    ? book.description.slice(Math.floor(book.description.length / 2))
    : 'Would you have done anything different, if you had the chance to undo your regrets? A dazzling novel about all the choices that go into a life well lived.';

  const releaseDate = book?.publishedYear
    ? `${book.publishedYear}`
    : 'August 13, 2020';

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #ffd9dc', borderTopColor: '#7b0d1e', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .bdp-topbar {
          position: sticky; top: 0; width: 100%; z-index: 40;
          height: 64px; background: #fff0f0;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 2rem; flex-shrink: 0;
          border-bottom: 1px solid #ffe1e3;
        }
        .bdp-body {
          padding: 2.5rem 2rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          max-width: 1280px;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .bdp-body { grid-template-columns: 5fr 7fr; }
        }
        .bdp-related-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (min-width: 768px) {
          .bdp-related-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .bdp-action-btn {
          width: 100%; height: 52px;
          border-radius: 0.75rem;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem;
          font-family: Inter, sans-serif;
          font-weight: 700; font-size: 0.9375rem;
          transition: opacity 0.15s;
        }
        .bdp-action-btn:hover { opacity: 0.9; }
        .bdp-half-btn {
          flex: 1; height: 48px;
          border-radius: 0.75rem;
          border: 1.5px solid #dfbfbe; background: #ffffff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem;
          font-family: Inter, sans-serif; font-weight: 600; font-size: 0.875rem;
          color: #56000f; transition: background 0.15s;
        }
        .bdp-half-btn:hover { background: #fff0f0; }
        .bdp-stat-box {
          flex: 1; background: #ffffff;
          border: 1.5px solid #dfbfbe; border-radius: 0.75rem;
          padding: 1rem; text-align: center;
        }
        .bdp-genre-pill {
          display: inline-flex; align-items: center;
          padding: 4px 14px;
          border-radius: 9999px;
          border: 1.5px solid #dfbfbe;
          font-family: Inter, sans-serif; font-size: 0.75rem;
          font-weight: 700; letter-spacing: 0.08em;
          color: #2d1418; background: transparent;
          text-transform: uppercase; white-space: nowrap;
        }
        .bdp-meta-col {
          display: flex; flex-direction: column; gap: 4px;
        }
        .bdp-similar-card:hover .bdp-similar-overlay { opacity: 1; }
      `}</style>

      {/* ── Custom Topbar ── */}
      <header className="bdp-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'Explore',    active: false, to: '/home/search'  },
              { label: 'My Library', active: true,  to: '/home/library' },
              { label: 'Categories', active: false, to: '/home/search'  },
            ].map(({ label, active, to }) => (
              <a key={label} href="#" onClick={e => { e.preventDefault(); navigate(to); }} style={{
                fontFamily: 'Playfair Display, Georgia, serif',
                fontWeight: active ? 700 : 600,
                fontSize: '0.9375rem',
                color: active ? '#7b0d1e' : 'rgba(86,0,15,0.55)',
                borderBottom: active ? '2px solid #7b0d1e' : 'none',
                paddingBottom: active ? 2 : 0,
                textDecoration: 'none',
              }}>
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <form
            onSubmit={e => { e.preventDefault(); if (search.trim()) navigate(`/home/search?q=${encodeURIComponent(search.trim())}`); }}
            style={{ position: 'relative' }}
          >
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#584141', fontSize: '1rem', pointerEvents: 'none' }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search the collection..."
              style={{ background: '#ffffff', border: 'none', borderRadius: 9999, padding: '0.4rem 1rem 0.4rem 2.25rem', fontSize: '0.875rem', width: 220, fontFamily: 'Inter, sans-serif', outline: 'none' }}
              onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(123,13,30,0.2)')}
              onBlur={e => (e.target.style.boxShadow = 'none')}
            />
          </form>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(136,0,30,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7b0d1e')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(136,0,30,0.6)')}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#7b0d1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlTLJBiPQxRRyNZ6u6UWsSeXwgTPPMVLl-RtylPoX5zhNVKefW2ACYioBQ3RT53aGOP3eM6yh_-tbNGA5n5Jd6mrDsB-tXfBOJvMFtUSZHCnjltxr-1ZWGx98rqEkALoeoE-bdJ-PlxsQZjieEHa9eVUid3eAdjjPjq63nA3dQCUASPqyxKZoU0_78duexDAyZudUHzDVOH9XWb0f0EJeDY-U_2oMMRzJ9QakzG3waKZN_8pCMALtBSldlFeLdzZZYRRuhWRgoMKo"
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="bdp-body">

        {/* ── LEFT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Cover container */}
          <div style={{
            background: 'linear-gradient(160deg, #d45c28 0%, #b03a1a 100%)',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 380,
          }}>
            {/* Badge */}
            <div style={{
              position: 'absolute', top: '1rem', left: '1rem',
              background: '#7b0d1e', color: '#ffffff',
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '4px 12px',
              borderRadius: 9999, fontFamily: 'Inter, sans-serif',
            }}>
              Featured Selection
            </div>
            {/* Cover image */}
            <img
              src={coverUrl}
              alt={title}
              style={{
                width: 220, height: 310,
                objectFit: 'cover',
                borderRadius: '0.75rem',
                boxShadow: '0 20px 50px rgba(86,0,15,0.35)',
              }}
            />
          </div>

          {/* Read Now */}
          <button
            className="bdp-action-btn"
            style={{ background: '#7b0d1e', color: '#ffffff' }}
            onClick={() => navigate(`/reader/${id}`)}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '1.125rem' }}>auto_stories</span>
            Read Now
          </button>

          {/* Listen to Audiobook */}
          <button
            className="bdp-action-btn"
            style={{ background: '#c9a84c', color: '#503d00' }}
            onClick={() => navigate(`/reader/${id}?mode=audio`)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>headphones</span>
            Listen to Audiobook
          </button>

          {/* Save + Share */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="bdp-half-btn"
              style={saved ? { background: '#fff0f0', color: '#7b0d1e', borderColor: '#7b0d1e' } : {}}
              onClick={() => setSaved(v => !v)}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>bookmark</span>
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              className="bdp-half-btn"
              onClick={() => navigator.share?.({ title, url: window.location.href })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>share</span>
              Share
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="bdp-stat-box">
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2d1418', lineHeight: 1 }}>
                {book?.rating ?? '4.8'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#584141', marginTop: 4 }}>
                Rating
              </p>
            </div>
            <div className="bdp-stat-box">
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2d1418', lineHeight: 1 }}>
                {book?.readers ? (book.readers >= 1000 ? `${(book.readers / 1000).toFixed(1)}k` : book.readers) : '12.4k'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#584141', marginTop: 4 }}>
                Readers
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Breadcrumb */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {[
              { label: 'Library',  to: '/home/library' },
              { label: category,   to: `/home/search?category=${encodeURIComponent(category)}` },
              { label: title,      to: null },
            ].map(({ label, to }, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <a href="#" onClick={e => { e.preventDefault(); to && navigate(to); }} style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.6875rem', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: i === arr.length - 1 ? '#7b0d1e' : 'rgba(86,0,15,0.45)',
                  textDecoration: 'none',
                }}>
                  {label.toUpperCase()}
                </a>
                {i < arr.length - 1 && (
                  <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', color: 'rgba(86,0,15,0.4)' }}>chevron_right</span>
                )}
              </span>
            ))}
          </nav>

          {/* Title */}
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            fontWeight: 700, color: '#2d1418',
            lineHeight: 1.15, margin: 0,
          }}>
            {title}
          </h1>

          {/* Author */}
          <p style={{
            fontFamily: 'Lora, serif', fontStyle: 'italic',
            fontSize: '1.0625rem', color: '#584141', margin: 0,
          }}>
            by {author}
          </p>

          {/* Genre tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {genres.map(g => (
              <span key={g} className="bdp-genre-pill">{g}</span>
            ))}
            {(book?.isBestseller !== false) && (
              <span className="bdp-genre-pill" style={{ background: '#c9a84c', border: '1.5px solid #c9a84c', color: '#503d00' }}>
                Bestseller
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#2d1418', lineHeight: 1.7, margin: 0 }}>
              {description1}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#2d1418', lineHeight: 1.7, margin: 0 }}>
              {description2}
            </p>
          </div>

          {/* Metadata row */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
            gap: '1rem', paddingTop: '1rem',
            borderTop: '1px solid #ffe1e3',
          }}>
            {[
              { label: 'Publisher',     value: publisher                },
              { label: 'Release Date',  value: releaseDate              },
              { label: 'Language',      value: language                 },
              { label: 'Format',        value: `Hardcover, ${pageCount}p` },
            ].map(({ label, value }) => (
              <div key={label} className="bdp-meta-col">
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8b7170', margin: 0 }}>
                  {label}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: '#2d1418', margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Related by Authors */}
          <div style={{ paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#2d1418', margin: 0 }}>
                Related by Authors
              </h3>
              <a href="#" onClick={e => { e.preventDefault(); navigate(`/home/search?category=${encodeURIComponent(category)}`); }} style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#7b0d1e', textDecoration: 'none',
              }}>
                View Collection
              </a>
            </div>

            <div className="bdp-related-grid">
              {similar.map((b) => (
                <div
                  key={b._id}
                  style={{ cursor: 'pointer', position: 'relative' }}
                  className="bdp-similar-card"
                  onClick={() => navigate(`/home/books/${b._id}`)}
                >
                  <div style={{ aspectRatio: '3/4', borderRadius: '0.75rem', overflow: 'hidden', background: '#ffd9dc', marginBottom: '0.625rem', position: 'relative' }}>
                    {b.coverUrl ? (
                      <img src={b.coverUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#ffd9dc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined" style={{ color: '#7b0d1e', fontSize: '2rem', opacity: 0.3 }}>menu_book</span>
                      </div>
                    )}
                    <div
                      className="bdp-similar-overlay"
                      style={{ position: 'absolute', inset: 0, background: 'rgba(86,0,15,0.25)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}
                    >
                      <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#56000f' }}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '1.25rem' }}>play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.875rem', fontWeight: 700, color: '#2d1418', lineHeight: 1.3, margin: '0 0 2px' }}>
                    {b.title?.length > 20 ? b.title.slice(0, 20) + '…' : b.title}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#584141', margin: 0 }}>
                    {Array.isArray(b.author) ? b.author[0] : b.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
