import { useEffect, useState } from 'react';
import { Link, useNavigate }   from 'react-router-dom';
import useBookStore   from '../../store/bookStore';
import useAuthStore   from '../../store/authStore';
import BookCard       from '../../components/ui/BookCard';

const FACULTY_GRID = [
  { icon: 'gavel',              label: 'Law'                   },
  { icon: 'biotech',            label: 'Science'               },
  { icon: 'laptop_mac',         label: 'Technology'            },
  { icon: 'terminal',           label: 'Computer Science'      },
  { icon: 'business_center',    label: 'Business'              },
  { icon: 'engineering',        label: 'Engineering'           },
  { icon: 'local_gas_station',  label: 'Petroleum Engineering' },
  { icon: 'foundation',         label: 'Civil Engineering'     },
  { icon: 'account_balance',    label: 'Politics'              },
  { icon: 'medical_services',   label: 'Medicine'              },
  { icon: 'school',             label: 'Education'             },
  { icon: 'trending_up',        label: 'Economics'             },
];

function CoverPlaceholder({ title, size = 112 }) {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#FDF4F2,#ffd9dc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span className="material-symbols-outlined" style={{ color: '#5C0F1F', opacity: 0.3, fontSize: size === 112 ? 32 : 40 }}>menu_book</span>
    </div>
  );
}

export default function HomePage() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const {
    continueReading, newestBooks, popularBooks, homeLoading,
    fetchContinueReading, fetchNewest, fetchPopular,
  } = useBookStore();

  const [arrivalIdx, setArrivalIdx] = useState(0);
  const PER_PAGE = 6;

  useEffect(() => {
    fetchContinueReading();
    fetchNewest();
    fetchPopular();
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const displayName  = user?.name ?? 'Scholar';
  const totalPages   = Math.max(1, Math.ceil(newestBooks.length / PER_PAGE));
  const pageArrivals = newestBooks.slice(arrivalIdx * PER_PAGE, arrivalIdx * PER_PAGE + PER_PAGE);

  return (
    <>
      <style>{`
        .hp-wrap {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }
        .hp-banner {
          background: linear-gradient(135deg, #8A1228 0%, #5C0F1F 100%);
          border-radius: 1rem;
          padding: 3rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(138,18,40,0.25);
        }
        .hp-bento {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .hp-bento { grid-template-columns: 8fr 4fr; }
        }
        .hp-read-card {
          background: #ffffff;
          border-radius: 0.75rem;
          padding: 1.25rem;
          display: flex;
          gap: 1.25rem;
          cursor: pointer;
          transition: transform 0.3s;
          text-decoration: none;
        }
        .hp-read-card:hover { transform: translateY(-4px); }
        .hp-faculty-btn {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 1rem; background: #FDF4F2;
          border-radius: 0.75rem; border: none; cursor: pointer;
          transition: background 0.2s; gap: 0.5rem;
        }
        .hp-faculty-btn:hover { background: #ffd9dc; }
        .hp-faculty-btn:hover .hp-faculty-icon { transform: scale(1.1); }
        .hp-faculty-icon { transition: transform 0.2s; }
        .hp-arrival { cursor: pointer; }
        .hp-arrival-img {
          aspect-ratio: 3/4;
          border-radius: 0.5rem;
          overflow: hidden;
          background: #FDF4F2;
          margin-bottom: 0.75rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          transition: box-shadow 0.2s;
        }
        .hp-arrival:hover .hp-arrival-img { box-shadow: 0 8px 24px rgba(0,0,0,0.16); }
        .hp-arrival-img img { width: 100%; height: 100%; object-fit: cover; }
        .hp-popular-row {
          background: #FDF4F2;
          border-radius: 1rem;
          overflow: hidden;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .hp-popular-row:hover { background: #ffe1e3; }
        .hp-arrivals-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (min-width: 768px)  { .hp-arrivals-grid { grid-template-columns: repeat(4,1fr); } }
        @media (min-width: 1024px) { .hp-arrivals-grid { grid-template-columns: repeat(6,1fr); } }
        .hp-popular-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 1024px) { .hp-popular-grid { grid-template-columns: repeat(3,1fr); } }
        .hp-skeleton {
          background: linear-gradient(90deg, #FDF4F2 25%, #ffe1e3 50%, #FDF4F2 75%);
          background-size: 200% 100%;
          animation: hp-shimmer 1.4s infinite;
          border-radius: 0.5rem;
        }
        @keyframes hp-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="hp-wrap">

        {/* ── Welcome Banner ── */}
        <div className="hp-banner">
          <div style={{ position:'absolute', top:'-20%', right:'-10%', width:384, height:384, background:'#aa333c', opacity:0.2, borderRadius:'50%', filter:'blur(48px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:'-10%', right:'10%', width:256, height:256, background:'#B8964A', opacity:0.1, borderRadius:'50%', filter:'blur(32px)', pointerEvents:'none' }} />
          <div style={{ position:'relative', zIndex:10, maxWidth:'32rem' }}>
            <span style={{ fontFamily:'Inter, sans-serif', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.2em', color:'#B8964A', marginBottom:'1rem', display:'block' }}>
              Personalized Curation
            </span>
            <h1 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'clamp(2.2rem,4vw,3rem)', fontWeight:800, color:'#fff', lineHeight:1.15, marginBottom:'1rem' }}>
              {greeting}, {displayName}.
            </h1>
            <p style={{ color:'rgba(255,209,212,0.8)', fontSize:'1.125rem', fontFamily:'Inter, sans-serif', lineHeight:1.6, marginBottom:'2rem' }}>
              Explore your curated collection of research papers, books, and podcasts — all in one place.
            </p>
            <div style={{ display:'flex', gap:'1rem' }}>
              <Link to="/home/library" style={{ background:'#B8964A', color:'#503d00', padding:'0.75rem 1.5rem', borderRadius:'0.5rem', fontFamily:'Inter, sans-serif', fontWeight:700, fontSize:'0.875rem', textDecoration:'none', transition:'transform 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.05)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
                View My Shelf
              </Link>
              <Link to="/home/search?sort=trending" style={{ background:'rgba(255,255,255,0.1)', backdropFilter:'blur(8px)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', padding:'0.75rem 1.5rem', borderRadius:'0.5rem', fontFamily:'Inter, sans-serif', fontWeight:700, fontSize:'0.875rem', textDecoration:'none', transition:'transform 0.15s' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.05)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
                Explore Trends
              </Link>
            </div>
          </div>
        </div>

        {/* ── Continue Reading + Faculty Archives ── */}
        <div className="hp-bento">

          {/* Continue Reading */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
              <h3 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'#1C0A0C' }}>Continue Reading</h3>
              <Link to="/home/library" style={{ color:'#5C0F1F', fontWeight:700, fontSize:'0.875rem', textDecoration:'none', fontFamily:'Inter, sans-serif' }}>
                View All History
              </Link>
            </div>

            {continueReading.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:'1rem', padding:'2rem', textAlign:'center', color:'#A89597', fontFamily:'Inter, sans-serif', fontSize:'0.875rem', border:'1px solid rgba(223,191,190,0.3)' }}>
                <span className="material-symbols-outlined" style={{ fontSize:40, color:'#EBD2CF', display:'block', marginBottom:8 }}>auto_stories</span>
                Start reading a book and it will appear here.
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                {continueReading.slice(0, 3).map((book) => (
                  <BookCard key={book._id} book={book} variant="landscape" showProgress />
                ))}
              </div>
            )}
          </div>

          {/* Faculty Archives */}
          <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
            <h3 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.5rem', fontWeight:700, color:'#1C0A0C' }}>Faculty Archives</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem' }}>
              {FACULTY_GRID.map(({ icon, label }) => (
                <button key={label} className="hp-faculty-btn"
                  onClick={() => navigate(`/home/search?category=${encodeURIComponent(label)}`)}>
                  <span className="material-symbols-outlined hp-faculty-icon" style={{ color:'#5C0F1F', fontSize:'1.75rem' }}>{icon}</span>
                  <span style={{ fontFamily:'Inter, sans-serif', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'#1C0A0C', lineHeight:1.2 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── New Arrivals ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
            <h3 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'#1C0A0C' }}>New Arrivals</h3>
            {newestBooks.length > PER_PAGE && (
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={()=>setArrivalIdx(p=>Math.max(0,p-1))} disabled={arrivalIdx===0}
                  style={{ width:40, height:40, borderRadius:'50%', border:'1px solid #EBD2CF', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', opacity:arrivalIdx===0?0.4:1 }}
                  onMouseEnter={e=>{if(arrivalIdx>0){e.currentTarget.style.background='#5C0F1F';e.currentTarget.style.color='#fff';}}}
                  onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='inherit';}}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button onClick={()=>setArrivalIdx(p=>Math.min(totalPages-1,p+1))} disabled={arrivalIdx>=totalPages-1}
                  style={{ width:40, height:40, borderRadius:'50%', border:'1px solid #EBD2CF', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', opacity:arrivalIdx>=totalPages-1?0.4:1 }}
                  onMouseEnter={e=>{if(arrivalIdx<totalPages-1){e.currentTarget.style.background='#5C0F1F';e.currentTarget.style.color='#fff';}}}
                  onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='inherit';}}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>

          {homeLoading ? (
            <div className="hp-arrivals-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="hp-skeleton" style={{ aspectRatio:'3/4', marginBottom:'0.75rem' }} />
                  <div className="hp-skeleton" style={{ height:14, marginBottom:6 }} />
                  <div className="hp-skeleton" style={{ height:11, width:'60%' }} />
                </div>
              ))}
            </div>
          ) : pageArrivals.length === 0 ? (
            <div style={{ textAlign:'center', color:'#A89597', fontFamily:'Inter, sans-serif', padding:'2rem' }}>No books yet.</div>
          ) : (
            <div className="hp-arrivals-grid">
              {pageArrivals.map((book, i) => (
                <BookCard key={book._id ?? book.id ?? i} book={book} variant="portrait" />
              ))}
            </div>
          )}
        </div>

        {/* ── Popular this week ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
          <h3 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:'#1C0A0C' }}>Popular this week</h3>

          {homeLoading ? (
            <div className="hp-popular-grid">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="hp-skeleton" style={{ height:96, borderRadius:'1rem' }} />
              ))}
            </div>
          ) : popularBooks.length === 0 ? (
            <div style={{ textAlign:'center', color:'#A89597', fontFamily:'Inter, sans-serif', padding:'2rem' }}>No books yet.</div>
          ) : (
            <div className="hp-popular-grid">
              {popularBooks.slice(0, 3).map((book, i) => (
                <div key={book._id ?? book.id ?? i} className="hp-popular-row"
                  onClick={() => book._id && !book.isExternal ? navigate(`/home/books/${book._id}`) : book.fileUrl && window.open(book.fileUrl, '_blank')}>
                  {book.coverUrl ? (
                    <div style={{ width:96, height:96, flexShrink:0, overflow:'hidden' }}>
                      <img src={book.coverUrl} alt={book.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width:96, height:96, flexShrink:0, padding:'1rem' }}>
                      <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:'linear-gradient(135deg,#8A1228 0%,#5C0F1F 100%)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.5rem', fontWeight:700 }}>
                        {i + 1}
                      </div>
                    </div>
                  )}
                  <div style={{ padding:'1rem', overflow:'hidden' }}>
                    <h4 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.125rem', fontWeight:700, color:'#1C0A0C', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                      {book.title}
                    </h4>
                    <p style={{ color:'#6B5456', fontSize:'0.75rem', marginTop:4, fontFamily:'Inter, sans-serif' }}>
                      {book.author ?? book.category ?? ''}
                      {book.ratingCount > 0 && ` · ${book.ratingCount.toLocaleString()} ratings`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <footer style={{ padding:'2rem 0', background:'#FCE8E6', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <div style={{ display:'flex', gap:'1.5rem', marginBottom:'0.25rem' }}>
            {[
              { label:'Privacy',   to:'/privacy'  },
              { label:'Terms',     to:'/terms'    },
              { label:'Translate', to:'/home/profile/language-preferences' },
              { label:'Books API', to:'/home/search' },
            ].map(({label,to})=>(
              <Link key={label} to={to} style={{ fontFamily:'Inter, sans-serif', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(138,18,40,0.4)', textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.color='#5C0F1F')}
                onMouseLeave={e=>(e.currentTarget.style.color='rgba(138,18,40,0.4)')}>
                {label}
              </Link>
            ))}
          </div>
          <p style={{ fontFamily:'Inter, sans-serif', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(138,18,40,0.5)' }}>
            Powered by Google
          </p>
        </footer>

      </div>
    </>
  );
}
