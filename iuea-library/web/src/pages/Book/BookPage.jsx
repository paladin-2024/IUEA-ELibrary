import { useState, useEffect }                          from 'react';
import { useParams, useNavigate }                       from 'react-router-dom';
import { useQuery, useMutation, useQueryClient }        from '@tanstack/react-query';
import { useBook, useSimilarBooks }                     from '../../hooks/useBooks';
import api                                              from '../../services/api';
import toast                                            from 'react-hot-toast';

// ── API helpers ────────────────────────────────────────────────────────────────
const borrowBook    = (bookId)        => api.post('/borrowing', { bookId }).then(r => r.data);
const fetchReviews  = (bookId)        => api.get(`/reviews/${bookId}`).then(r => r.data);
const fetchMyReview = (bookId)        => api.get(`/reviews/my/${bookId}`).then(r => r.data);
const submitReview  = ({ bookId, rating, text }) => api.post(`/reviews/${bookId}`, { rating, text }).then(r => r.data);
const voteHelpful   = ({ bookId, reviewId })     => api.post(`/reviews/${bookId}/helpful`, { reviewId }).then(r => r.data);

// ── Star Rating Component ─────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s}
          onClick={() => !readonly && onChange?.(s)}
          onMouseEnter={() => !readonly && setHover(s)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{ fontSize: size, cursor: readonly ? 'default' : 'pointer', color: s <= (hover || value) ? '#F59E0B' : '#D1D5DB', transition: 'color 0.1s' }}
        >★</span>
      ))}
    </div>
  );
}

// ── Citation Modal ────────────────────────────────────────────────────────────
function CitationModal({ book, onClose }) {
  const [style, setStyle]   = useState('APA');
  const [copied, setCopied] = useState(false);

  const year   = book?.publishedYear ?? new Date().getFullYear();
  const author = book?.author ?? 'Unknown';
  const title  = book?.title  ?? 'Untitled';
  const pub    = 'Project Gutenberg';

  const citations = {
    APA:     `${author} (${year}). *${title}*. ${pub}.`,
    MLA:     `${author}. *${title}*. ${pub}, ${year}.`,
    Chicago: `${author}. *${title}*. ${pub}, ${year}.`,
    Harvard: `${author} ${year}, *${title}*, ${pub}.`,
    BibTeX:  `@book{${author.split(',')[0].toLowerCase().replace(/\s/g,'')}${year},\n  author = {${author}},\n  title  = {${title}},\n  year   = {${year}},\n  publisher = {${pub}}\n}`,
  };
  const text = citations[style];

  const copy = () => {
    navigator.clipboard.writeText(text.replace(/\*/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontFamily: 'Playfair Display,serif', color: '#8A1228', fontSize: '1.125rem' }}>Cite this Book</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>

        {/* Style tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {Object.keys(citations).map(s => (
            <button key={s} onClick={() => setStyle(s)}
              style={{ padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.813rem', fontWeight: 600, border: 'none', cursor: 'pointer',
                background: style === s ? '#8A1228' : '#F3F4F6', color: style === s ? '#fff' : '#374151' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Citation text */}
        <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '1rem', fontFamily: style === 'BibTeX' ? 'monospace' : 'inherit', fontSize: '0.875rem', color: '#1A1A1A', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
          {text.replace(/\*/g, '')}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={copy} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: 'none', background: copied ? '#D1FAE5' : '#8A1228', color: copied ? '#065F46' : '#fff', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}>
            {copied ? '✓ Copied!' : 'Copy Citation'}
          </button>
          <button onClick={onClose} style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

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
  const qc         = useQueryClient();
  const [search,      setSearch]      = useState('');
  const [saved,       setSaved]       = useState(false);
  const [showCitation, setShowCitation] = useState(false);
  const [reviewText,   setReviewText]   = useState('');
  const [reviewRating, setReviewRating] = useState(0);

  const { data: reviewsData }  = useQuery({ queryKey: ['reviews', id], queryFn: () => fetchReviews(id),  enabled: !!id, staleTime: 60_000 });
  const { data: myReviewData } = useQuery({ queryKey: ['my-review', id], queryFn: () => fetchMyReview(id), enabled: !!id, staleTime: 60_000 });

  const reviews     = reviewsData?.reviews ?? [];
  const ratingBreak = reviewsData?.ratingBreakdown ?? {};
  const myReview    = myReviewData?.review;

  useEffect(() => {
    if (myReview) { setReviewRating(myReview.rating); setReviewText(myReview.text ?? ''); }
  }, [myReview]);

  const { mutate: borrow, isPending: borrowing } = useMutation({
    mutationFn: () => borrowBook(id),
    onSuccess:  () => { toast.success('Borrow request sent! The library will notify you when approved.'); qc.invalidateQueries(['my-loans']); },
    onError:    (e) => toast.error(e?.response?.data?.message ?? 'Could not send request.'),
  });

  const { mutate: postReview, isPending: submittingReview } = useMutation({
    mutationFn: () => submitReview({ bookId: id, rating: reviewRating, text: reviewText }),
    onSuccess:  () => { toast.success('Review saved!'); qc.invalidateQueries(['reviews', id]); qc.invalidateQueries(['my-review', id]); },
    onError:    (e) => toast.error(e?.response?.data?.message ?? 'Could not save review.'),
  });

  const { mutate: helpful } = useMutation({
    mutationFn: (reviewId) => voteHelpful({ bookId: id, reviewId }),
    onSuccess: () => qc.invalidateQueries(['reviews', id]),
  });

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
        <div style={{ width: 40, height: 40, border: '3px solid #ffd9dc', borderTopColor: '#5C0F1F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      {showCitation && <CitationModal book={book} onClose={() => setShowCitation(false)} />}
      <style>{`
        .bdp-topbar {
          position: sticky; top: 0; width: 100%; z-index: 40;
          height: 64px; background: #FCE8E6;
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
          border: 1.5px solid #EBD2CF; background: #ffffff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          gap: 0.5rem;
          font-family: Inter, sans-serif; font-weight: 600; font-size: 0.875rem;
          color: #8A1228; transition: background 0.15s;
        }
        .bdp-half-btn:hover { background: #FCE8E6; }
        .bdp-stat-box {
          flex: 1; background: #ffffff;
          border: 1.5px solid #EBD2CF; border-radius: 0.75rem;
          padding: 1rem; text-align: center;
        }
        .bdp-genre-pill {
          display: inline-flex; align-items: center;
          padding: 4px 14px;
          border-radius: 9999px;
          border: 1.5px solid #EBD2CF;
          font-family: Inter, sans-serif; font-size: 0.75rem;
          font-weight: 700; letter-spacing: 0.08em;
          color: #1C0A0C; background: transparent;
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
                color: active ? '#5C0F1F' : 'rgba(138,18,40,0.55)',
                borderBottom: active ? '2px solid #5C0F1F' : 'none',
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
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B5456', fontSize: '1rem', pointerEvents: 'none' }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search the collection..."
              style={{ background: '#ffffff', border: 'none', borderRadius: 9999, padding: '0.4rem 1rem 0.4rem 2.25rem', fontSize: '0.875rem', width: 220, fontFamily: 'Inter, sans-serif', outline: 'none' }}
              onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(107,15,26,0.2)')}
              onBlur={e => (e.target.style.boxShadow = 'none')}
            />
          </form>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(136,0,30,0.6)' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#5C0F1F')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(136,0,30,0.6)')}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', background: '#5C0F1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              background: '#5C0F1F', color: '#ffffff',
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
                boxShadow: '0 20px 50px rgba(138,18,40,0.35)',
              }}
            />
          </div>

          {/* Read Now */}
          <button
            className="bdp-action-btn"
            style={{ background: '#5C0F1F', color: '#ffffff' }}
            onClick={() => navigate(`/reader/${id}`)}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '1.125rem' }}>auto_stories</span>
            Read Now
          </button>

          {/* Listen to Audiobook */}
          <button
            className="bdp-action-btn"
            style={{ background: '#B8964A', color: '#503d00' }}
            onClick={() => navigate(`/reader/${id}?mode=audio`)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>headphones</span>
            Listen to Audiobook
          </button>

          {/* Save + Share */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="bdp-half-btn"
              style={saved ? { background: '#FCE8E6', color: '#5C0F1F', borderColor: '#5C0F1F' } : {}}
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

          {/* Borrow Physical Copy */}
          <button
            className="bdp-action-btn"
            style={{ background: '#1E3A5F', color: '#fff', opacity: borrowing ? 0.7 : 1 }}
            onClick={() => borrow()}
            disabled={borrowing}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>local_library</span>
            {borrowing ? 'Requesting…' : 'Borrow Physical Copy'}
          </button>

          {/* Cite this Book */}
          <button
            className="bdp-half-btn"
            style={{ justifyContent: 'center' }}
            onClick={() => setShowCitation(true)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>format_quote</span>
            Cite this Book
          </button>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="bdp-stat-box">
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1C0A0C', lineHeight: 1 }}>
                {book?.rating ?? '4.8'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B5456', marginTop: 4 }}>
                Rating
              </p>
            </div>
            <div className="bdp-stat-box">
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#1C0A0C', lineHeight: 1 }}>
                {book?.readers ? (book.readers >= 1000 ? `${(book.readers / 1000).toFixed(1)}k` : book.readers) : '12.4k'}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B5456', marginTop: 4 }}>
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
                  color: i === arr.length - 1 ? '#5C0F1F' : 'rgba(138,18,40,0.45)',
                  textDecoration: 'none',
                }}>
                  {label.toUpperCase()}
                </a>
                {i < arr.length - 1 && (
                  <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', color: 'rgba(138,18,40,0.4)' }}>chevron_right</span>
                )}
              </span>
            ))}
          </nav>

          {/* Title */}
          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 'clamp(2rem, 3.5vw, 3rem)',
            fontWeight: 700, color: '#1C0A0C',
            lineHeight: 1.15, margin: 0,
          }}>
            {title}
          </h1>

          {/* Author */}
          <p style={{
            fontFamily: 'Lora, serif', fontStyle: 'italic',
            fontSize: '1.0625rem', color: '#6B5456', margin: 0,
          }}>
            by {author}
          </p>

          {/* Genre tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {genres.map(g => (
              <span key={g} className="bdp-genre-pill">{g}</span>
            ))}
            {(book?.isBestseller !== false) && (
              <span className="bdp-genre-pill" style={{ background: '#B8964A', border: '1.5px solid #B8964A', color: '#503d00' }}>
                Bestseller
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#1C0A0C', lineHeight: 1.7, margin: 0 }}>
              {description1}
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', color: '#1C0A0C', lineHeight: 1.7, margin: 0 }}>
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
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#A89597', margin: 0 }}>
                  {label}
                </p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: '#1C0A0C', margin: 0 }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Related by Authors */}
          <div style={{ paddingTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C0A0C', margin: 0 }}>
                Related by Authors
              </h3>
              <a href="#" onClick={e => { e.preventDefault(); navigate(`/home/search?category=${encodeURIComponent(category)}`); }} style={{
                fontFamily: 'Inter, sans-serif', fontSize: '0.6875rem',
                fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                color: '#5C0F1F', textDecoration: 'none',
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
                        <span className="material-symbols-outlined" style={{ color: '#5C0F1F', fontSize: '2rem', opacity: 0.3 }}>menu_book</span>
                      </div>
                    )}
                    <div
                      className="bdp-similar-overlay"
                      style={{ position: 'absolute', inset: 0, background: 'rgba(138,18,40,0.25)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s' }}
                    >
                      <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8A1228' }}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '1.25rem' }}>play_arrow</span>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.875rem', fontWeight: 700, color: '#1C0A0C', lineHeight: 1.3, margin: '0 0 2px' }}>
                    {b.title?.length > 20 ? b.title.slice(0, 20) + '…' : b.title}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6B5456', margin: 0 }}>
                    {Array.isArray(b.author) ? b.author[0] : b.author}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Reviews Section ─────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem 3rem' }}>
        <h2 style={{ fontFamily: 'Playfair Display,serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C0A0C', marginBottom: '1.5rem' }}>
          Reviews & Ratings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

          {/* Rating breakdown */}
          {reviewsData?.total > 0 && (
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', background: '#FDF4F2', borderRadius: 12, padding: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display,serif', fontSize: '3rem', fontWeight: 700, color: '#8A1228', lineHeight: 1 }}>
                  {book?.rating?.toFixed(1) ?? '—'}
                </div>
                <StarRating value={Math.round(book?.rating ?? 0)} readonly />
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 4 }}>{reviewsData.total} review{reviewsData.total !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                {[5,4,3,2,1].map(star => {
                  const count = ratingBreak[star] ?? 0;
                  const pct   = reviewsData.total ? Math.round((count / reviewsData.total) * 100) : 0;
                  return (
                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.75rem', color: '#6B7280', width: 16 }}>{star}</span>
                      <span style={{ color: '#F59E0B', fontSize: '0.75rem' }}>★</span>
                      <div style={{ flex: 1, height: 6, background: '#E5E7EB', borderRadius: 999 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#F59E0B', borderRadius: 999, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF', width: 28, textAlign: 'right' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Write a review */}
          <div style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1A1A1A' }}>
              {myReview ? 'Edit Your Review' : 'Write a Review'}
            </h3>
            <StarRating value={reviewRating} onChange={setReviewRating} size={28} />
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder="Share your thoughts about this book..."
              style={{ width: '100%', marginTop: '0.75rem', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.75rem', fontSize: '0.875rem', minHeight: 100, resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem', gap: '0.5rem', alignItems: 'center' }}>
              {myReview?.isVerified && (
                <span style={{ fontSize: '0.75rem', color: '#065F46', background: '#D1FAE5', padding: '0.2rem 0.6rem', borderRadius: 999 }}>✓ Verified Reader</span>
              )}
              <button
                disabled={!reviewRating || submittingReview}
                onClick={() => postReview()}
                style={{ padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', background: reviewRating ? '#8A1228' : '#E5E7EB', color: reviewRating ? '#fff' : '#9CA3AF', fontWeight: 700, cursor: reviewRating ? 'pointer' : 'not-allowed' }}
              >
                {submittingReview ? 'Saving…' : myReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </div>

          {/* Review list */}
          {reviews.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map(r => (
                <div key={r.id} style={{ background: '#fff', border: '1px solid #F3F4F6', borderRadius: 12, padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FCE8E6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {r.user?.avatar
                          ? <img src={r.user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontWeight: 700, color: '#8A1228', fontSize: '0.875rem' }}>{r.user?.name?.[0] ?? '?'}</span>
                        }
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#1A1A1A' }}>{r.user?.name ?? 'Anonymous'}</span>
                          {r.isVerified && <span style={{ fontSize: '0.7rem', background: '#D1FAE5', color: '#065F46', padding: '0.1rem 0.4rem', borderRadius: 999 }}>✓ Verified</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{r.user?.faculty}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StarRating value={r.rating} readonly size={14} />
                      <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: 2 }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {r.text && <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: '#374151', lineHeight: 1.6 }}>{r.text}</p>}
                  <button onClick={() => helpful(r.id)} style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 999, padding: '0.2rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', color: r.votedHelpful ? '#065F46' : '#6B7280' }}>
                    👍 Helpful ({r.helpfulCount})
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
