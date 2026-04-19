import { useState }    from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PodcastCard — premium podcast/episode card.
 *
 * Props:
 *   podcast   – podcast object (id, _id, title, author, coverUrl, category,
 *               duration, durationFormatted, series, host)
 *   variant   – 'square' (default) | 'row' | 'featured'
 *   onPlay    – optional play callback
 */
export default function PodcastCard({ podcast, variant = 'square', onPlay }) {
  const navigate  = useNavigate();
  const [hovered, setHovered] = useState(false);

  const id    = podcast.id ?? podcast._id;
  const goTo  = () => navigate(`/home/podcasts/${id}`);
  const play  = (e) => { e.stopPropagation(); onPlay ? onPlay(podcast) : goTo(); };

  const dur = podcast.durationFormatted
    ?? (podcast.duration > 0
      ? `${Math.floor(podcast.duration / 60)}:${String(podcast.duration % 60).padStart(2, '0')}`
      : null);

  /* ── Square card ─────────────────────────────────────────────────────── */
  if (variant === 'square') {
    return (
      <div
        role="button" tabIndex={0}
        onClick={goTo}
        onKeyDown={e => e.key === 'Enter' && goTo()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          cursor: 'pointer', outline: 'none',
          transition: 'transform 0.25s cubic-bezier(.22,1,.36,1)',
          transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        }}
      >
        {/* Artwork */}
        <div style={{
          position: 'relative', aspectRatio: '1/1',
          borderRadius: 16, overflow: 'hidden',
          background: 'linear-gradient(135deg,#56000f,#7b0d1e)',
          boxShadow: hovered
            ? '0 18px 36px rgba(86,0,15,0.22), 0 4px 10px rgba(0,0,0,0.08)'
            : '0 4px 14px rgba(0,0,0,0.10)',
          transition: 'box-shadow 0.25s ease',
          marginBottom: 12,
        }}>
          {podcast.coverUrl ? (
            <img src={podcast.coverUrl} alt={podcast.title} loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.4s cubic-bezier(.22,1,.36,1)',
              }}
            />
          ) : (
            <NoCover />
          )}
          {/* Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(10,0,4,0.45)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.22s ease',
          }} />
          {/* Play button */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.22s ease',
          }}>
            <button onClick={play} style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(255,255,255,0.94)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transform: hovered ? 'scale(1)' : 'scale(0.6)',
              transition: 'transform 0.25s cubic-bezier(.22,1,.36,1)',
            }}>
              <span className="material-symbols-outlined" style={{
                color: '#7b0d1e', fontSize: 24, fontVariationSettings: "'FILL' 1",
              }}>play_arrow</span>
            </button>
          </div>
          {/* Duration */}
          {dur && (
            <span style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.62)', color: '#fff',
              fontSize: 10, fontWeight: 600, padding: '3px 7px',
              borderRadius: 6, fontFamily: 'Inter, sans-serif',
              backdropFilter: 'blur(4px)',
            }}>{dur}</span>
          )}
          {/* Category */}
          {podcast.category && (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(201,168,76,0.92)', color: '#3d2900',
              fontSize: 9, fontWeight: 700, padding: '3px 7px',
              borderRadius: 6, fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              backdropFilter: 'blur(4px)',
            }}>
              {podcast.category.length > 12 ? podcast.category.slice(0, 12) + '…' : podcast.category}
            </span>
          )}
        </div>
        {/* Info */}
        <p style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 14, fontWeight: 700, color: '#1a0609',
          lineHeight: 1.3, margin: '0 0 3px',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{podcast.title}</p>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11,
          color: '#8b7170', margin: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{podcast.author ?? podcast.host ?? podcast.series ?? ''}</p>
      </div>
    );
  }

  /* ── Row card ────────────────────────────────────────────────────────── */
  if (variant === 'row') {
    return (
      <div
        role="button" tabIndex={0}
        onClick={goTo}
        onKeyDown={e => e.key === 'Enter' && goTo()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
          background: hovered ? '#fff0f0' : '#ffffff',
          border: '1px solid rgba(223,191,190,0.25)',
          boxShadow: hovered ? '0 4px 16px rgba(86,0,15,0.09)' : 'none',
          transition: 'background 0.18s ease, box-shadow 0.18s ease',
          outline: 'none',
        }}
      >
        <div style={{
          width: 56, height: 56, flexShrink: 0,
          borderRadius: 10, overflow: 'hidden',
          background: 'linear-gradient(135deg,#56000f,#7b0d1e)',
        }}>
          {podcast.coverUrl
            ? <img src={podcast.coverUrl} alt={podcast.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <NoCover />}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <p style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 14, fontWeight: 700, color: '#1a0609',
            margin: '0 0 2px', lineHeight: 1.3,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{podcast.title}</p>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#8b7170', margin: 0,
          }}>
            {[podcast.category, dur].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button onClick={play} style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: hovered ? '#7b0d1e' : '#ffe9ea',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.18s ease',
        }}>
          <span className="material-symbols-outlined" style={{
            fontSize: 18, color: hovered ? '#fff' : '#7b0d1e',
            fontVariationSettings: "'FILL' 1",
            transition: 'color 0.18s ease',
          }}>play_arrow</span>
        </button>
      </div>
    );
  }

  /* ── Featured hero card ───────────────────────────────────────────────── */
  return (
    <div
      role="button" tabIndex={0}
      onClick={goTo}
      onKeyDown={e => e.key === 'Enter' && goTo()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden',
        cursor: 'pointer', outline: 'none', aspectRatio: '16/7',
        background: 'linear-gradient(135deg,#56000f,#7b0d1e)',
        boxShadow: hovered
          ? '0 24px 48px rgba(86,0,15,0.28)'
          : '0 8px 24px rgba(86,0,15,0.16)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        transform: hovered ? 'scale(1.005)' : 'scale(1)',
      }}
    >
      {podcast.coverUrl && (
        <img src={podcast.coverUrl} alt={podcast.title} style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.5s cubic-bezier(.22,1,.36,1)',
        }} />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to right, rgba(20,0,5,0.88) 0%, rgba(20,0,5,0.3) 60%, transparent 100%)',
        padding: '2rem 2.5rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        {podcast.category && (
          <span style={{
            display: 'inline-block', marginBottom: 10,
            background: '#c9a84c', color: '#3d2900',
            fontSize: 10, fontWeight: 700, padding: '4px 10px',
            borderRadius: 6, fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.1em', width: 'fit-content',
          }}>{podcast.category}</span>
        )}
        <h2 style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 'clamp(1.4rem,3vw,2.2rem)', fontWeight: 800,
          color: '#fff', lineHeight: 1.2, margin: '0 0 6px', maxWidth: '60%',
        }}>{podcast.title}</h2>
        {(podcast.author ?? podcast.host) && (
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 13,
            color: 'rgba(255,209,212,0.8)', margin: '0 0 16px',
          }}>by {podcast.author ?? podcast.host}</p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={play} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#7b0d1e', color: '#fff', border: 'none',
            borderRadius: 10, cursor: 'pointer', padding: '10px 20px',
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            Listen Now
          </button>
          <button onClick={e => { e.stopPropagation(); goTo(); }} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10, cursor: 'pointer', padding: '10px 20px',
            fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
          }}>View Series</button>
        </div>
      </div>
    </div>
  );
}

function NoCover() {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg,#56000f,#7b0d1e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 32 }}>
        podcasts
      </span>
    </div>
  );
}
