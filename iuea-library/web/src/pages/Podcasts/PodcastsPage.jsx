import { useQuery }      from '@tanstack/react-query';
import { useNavigate }   from 'react-router-dom';
import { listPodcasts }  from '../../services/podcast.service';
import PodcastCard       from '../../components/podcast/PodcastCard';

const C = {
  primary:             '#8A1228',
  primaryContainer:    '#5C0F1F',
  tertiaryContainer:   '#B8964A',
  onTertiaryContainer: '#503d00',
  surface:             '#FCE8E6',
  surfaceContainerLow: '#FCE8E6',
  surfaceContainer:    '#FDF4F2',
  surfaceContainerHigh:'#ffe1e3',
  surfaceContainerHighest:'#ffd9dc',
  surfaceContainerLowest:'#ffffff',
  surfaceDim:          '#F2BEB8',
  onSurface:           '#1C0A0C',
  onSurfaceVariant:    '#6B5456',
  outline:             '#A89597',
  outlineVariant:      '#EBD2CF',
  secondary:           '#984447',
  onSecondaryContainer:'#782c2f',
};

function PodcastSkeleton() {
  return (
    <div style={{ aspectRatio:'1/1', borderRadius:'1rem', background:'linear-gradient(90deg,#FDF4F2 25%,#ffe1e3 50%,#FDF4F2 75%)', backgroundSize:'200% 100%', animation:'pod-shimmer 1.4s infinite' }}>
      <style>{`@keyframes pod-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );
}

export default function PodcastsPage() {
  const navigate = useNavigate();

  const { data: podData, isLoading } = useQuery({
    queryKey: ['podcasts'],
    queryFn:  () => listPodcasts({ limit: 30 }),
    staleTime: 60_000,
  });

  const podcasts    = podData?.podcasts    ?? [];
  const categories  = podData?.categories  ?? [];
  const featured    = podcasts[0] ?? null;
  const grid        = podcasts.slice(1, 6);   // "Your Subscriptions" grid
  const trending    = podcasts.slice(0, 3);   // "Popular this week" list

  return (
    <>
      <style>{`
        .pp-topbar {
          position: sticky; top: 0; z-index: 40;
          height: 64px;
          background: ${C.surfaceContainerLow};
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 2rem;
        }
        .pp-banner-group:hover .pp-banner-img { transform: scale(1.05); }
        .pp-sub-card:hover .pp-sub-overlay { opacity: 1; }
        .pp-sub-card:hover .pp-sub-img { transform: scale(1.1); }
        .pp-trend-row:hover { background: ${C.surfaceContainerHigh}; }
        .pp-trend-row:hover .pp-trend-rank { color: ${C.primaryContainer}; }
        .pp-cat-tile:hover { transform: scale(1.05); }
        .pp-subs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        @media (min-width: 768px)  { .pp-subs-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 1024px) { .pp-subs-grid { grid-template-columns: repeat(5, 1fr); } }
        .pp-bento {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }
        @media (min-width: 1024px) {
          .pp-bento { grid-template-columns: repeat(12, 1fr); }
          .pp-bento-left  { grid-column: span 8; }
          .pp-bento-right { grid-column: span 4; }
        }
      `}</style>

      {/* ── Topbar ── */}
      <header className="pp-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: C.primary }}>
            Podcast Hub
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: `rgba(255,217,220,0.3)`, borderRadius: 9999, padding: '6px 16px', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: C.onSurfaceVariant, fontSize: '1rem' }}>search</span>
            <input style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', width: 192 }} placeholder="Search podcasts..." />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>

        {/* ── Featured Banner ── */}
        {isLoading ? (
          <div style={{ height: 420, borderRadius: '1.5rem', background: 'linear-gradient(90deg,#FDF4F2 25%,#ffe1e3 50%,#FDF4F2 75%)', backgroundSize:'200% 100%', animation:'pod-shimmer 1.4s infinite' }} />
        ) : featured ? (
          <section
            className="pp-banner-group"
            onClick={() => navigate(`/home/podcasts/${featured.id ?? featured._id}`)}
            style={{ position: 'relative', height: 420, borderRadius: '1.5rem', overflow: 'hidden', cursor: 'pointer' }}
          >
            {featured.coverUrl ? (
              <img
                className="pp-banner-img"
                src={featured.coverUrl}
                alt={featured.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s' }}
              />
            ) : (
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#8A1228,#5C0F1F)' }} />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: `linear-gradient(to right, rgba(138,18,40,0.9) 0%, rgba(138,18,40,0.4) 50%, transparent 100%)`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: '3rem',
            }}>
              <span style={{ display:'inline-block', padding:'4px 12px', background:C.tertiaryContainer, color:C.onTertiaryContainer, fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', borderRadius:'0.25rem', marginBottom:'1rem', width:'fit-content', fontFamily:'Inter, sans-serif' }}>
                {featured.category ?? 'Featured Series'}
              </span>
              <h2 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'clamp(2rem,5vw,3.75rem)', fontWeight:700, color:'#ffffff', maxWidth:'42rem', lineHeight:1.15, marginBottom:'1rem' }}>
                {featured.title}
              </h2>
              {featured.description && (
                <p style={{ color:'rgba(255,179,179,0.8)', fontFamily:'Inter, sans-serif', fontSize:'1.125rem', maxWidth:'36rem', marginBottom:'2rem', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                  {featured.description}
                </p>
              )}
              {featured.author && (
                <p style={{ color:'rgba(255,209,212,0.7)', fontFamily:'Inter, sans-serif', fontSize:'0.875rem', marginBottom:'1.5rem' }}>
                  by {featured.author}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button style={{ background:C.primaryContainer, color:'#ffffff', padding:'0.75rem 2rem', borderRadius:'0.5rem', border:'none', cursor:'pointer', fontFamily:'Inter, sans-serif', fontWeight:600, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:8, transition:'transform 0.15s' }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.02)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings:"'FILL' 1", fontSize:'1rem' }}>play_arrow</span>
                  Listen Now
                </button>
                <button style={{ backdropFilter:'blur(12px)', background:'rgba(255,255,255,0.1)', color:'#ffffff', padding:'0.75rem 2rem', borderRadius:'0.5rem', border:'1px solid rgba(255,255,255,0.2)', cursor:'pointer', fontFamily:'Inter, sans-serif', fontWeight:600, fontSize:'0.875rem', transition:'background 0.15s' }}
                  onClick={e=>{e.stopPropagation(); navigate('/home/podcasts');}}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.2)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.1)')}>
                  View Series
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── Podcast Grid ── */}
        <section>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'2rem' }}>
            <div>
              <h3 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:C.onSurface, margin:0 }}>
                Popular Podcasts
              </h3>
              <p style={{ color:C.onSurfaceVariant, fontFamily:'Inter, sans-serif', marginTop:4 }}>
                Live from the web
              </p>
            </div>
            <a onClick={() => navigate('/home/podcasts/browse')} style={{ color:C.primary, fontWeight:600, fontSize:'0.875rem', textDecoration:'none', display:'flex', alignItems:'center', gap:4, fontFamily:'Inter, sans-serif', cursor:'pointer' }}>
              View all
              <span className="material-symbols-outlined" style={{ fontSize:'0.875rem' }}>arrow_forward</span>
            </a>
          </div>

          <div className="pp-subs-grid">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <PodcastSkeleton key={i} />)
              : grid.map((pod, i) => (
                <PodcastCard key={pod.id ?? pod._id ?? i} podcast={pod} variant="square" />
              ))
            }
          </div>
        </section>

        {/* ── Popular + Categories bento ── */}
        <section className="pp-bento">

          {/* Left: Popular this week */}
          <div className="pp-bento-left">
            <h3 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:C.onSurface, marginBottom:'2rem' }}>
              Popular this week
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ height:80, borderRadius:'1rem', background:'linear-gradient(90deg,#FDF4F2 25%,#ffe1e3 50%,#FDF4F2 75%)', backgroundSize:'200% 100%', animation:'pod-shimmer 1.4s infinite' }} />
                  ))
                : trending.map((ep, i) => (
                    <PodcastCard key={ep.id ?? ep._id ?? i} podcast={ep} variant="row" />
                  ))
              }
            </div>
          </div>

          {/* Right: Browse Categories */}
          <div className="pp-bento-right">
            <h3 style={{ fontFamily:'Playfair Display, Georgia, serif', fontSize:'1.875rem', fontWeight:700, color:C.onSurface, marginBottom:'2rem' }}>
              Browse Categories
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {(categories.filter(c => c !== 'All').slice(0, 6).length > 0
                ? categories.filter(c => c !== 'All').slice(0, 6).map((cat, i) => ({
                    label: cat,
                    bg: [C.primaryContainer, C.tertiaryContainer, C.surfaceContainerHighest, C.secondary, C.outline, C.surfaceDim][i % 6],
                    color: [   '#ffffff',     C.onTertiaryContainer, '#782c2f', '#ffffff', '#ffffff', '#782c2f'][i % 6],
                  }))
                : [
                    { label:'Academic',     bg:C.primaryContainer,        color:'#ffffff'             },
                    { label:'Art & Culture', bg:C.tertiaryContainer,       color:C.onTertiaryContainer },
                    { label:'Tech Trends',  bg:C.surfaceContainerHighest, color:'#782c2f'             },
                    { label:'History',      bg:C.secondary,               color:'#ffffff'             },
                    { label:'Science',      bg:C.outline,                 color:'#ffffff'             },
                    { label:'Business',     bg:C.surfaceDim,              color:'#782c2f'             },
                  ]
              ).map(({ label, bg, color }) => (
                <div key={label} className="pp-cat-tile"
                  onClick={() => navigate(`/home/search?category=${encodeURIComponent(label)}`)}
                  style={{ height:96, borderRadius:'1rem', background:bg, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', textAlign:'center', cursor:'pointer', transition:'transform 0.2s' }}>
                  <span style={{ fontFamily:'Playfair Display, Georgia, serif', fontWeight:700, fontSize:'1.125rem', color }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop:'2rem', background:'rgba(255,217,220,0.5)', padding:'1.5rem', borderRadius:'1.5rem', border:`2px dashed rgba(223,191,190,0.5)` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
                <span className="material-symbols-outlined" style={{ color:C.primary, fontVariationSettings:"'FILL' 1" }}>auto_awesome</span>
                <h6 style={{ fontFamily:'Inter, sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', fontSize:'10px', color:C.primary, margin:0 }}>Curator's Choice</h6>
              </div>
              <p style={{ fontFamily:'Inter, sans-serif', fontSize:'0.875rem', color:C.onSurface, lineHeight:1.6, marginBottom:'1rem', fontStyle:'italic' }}>
                Explore podcasts that match your reading interests and academic focus.
              </p>
              <button onClick={() => navigate('/home/search')} style={{ width:'100%', padding:'0.5rem', background:'#ffffff', borderRadius:'0.5rem', border:'none', cursor:'pointer', color:C.primary, fontFamily:'Inter, sans-serif', fontSize:'0.875rem', fontWeight:700, boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
                Discover more
              </button>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ paddingTop:'1rem', paddingBottom:'2rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.5rem' }}>
          <p style={{ fontFamily:'Inter, sans-serif', fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.12em', color:'rgba(138,18,40,0.5)', margin:0 }}>
            Powered by iTunes · Podcast data is live
          </p>
        </footer>
      </div>

      {/* FAB */}
      <button style={{ position:'fixed', right:'1.5rem', bottom:'2rem', background:C.tertiaryContainer, color:C.onTertiaryContainer, width:56, height:56, borderRadius:'1rem', boxShadow:'0 8px 24px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer', zIndex:50, transition:'transform 0.15s' }}
        onClick={() => navigate('/home/podcasts')}
        onMouseEnter={e=>(e.currentTarget.style.transform='scale(1.1)')}
        onMouseLeave={e=>(e.currentTarget.style.transform='scale(1)')}>
        <span className="material-symbols-outlined" style={{ fontSize:'1.5rem' }}>podcasts</span>
      </button>
    </>
  );
}
