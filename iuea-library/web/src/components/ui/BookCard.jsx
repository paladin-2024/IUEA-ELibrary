import { useState }    from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * BookCard — premium book card.
 *
 * Props:
 *   book         – book object (_id, title, author, coverUrl, category,
 *                  languages, fileUrl, isExternal, progress, rating)
 *   variant      – 'portrait' (default) | 'landscape' | 'compact'
 *   showProgress – show reading progress bar
 *   onClick      – override click behaviour
 */
export default function BookCard({
  book,
  variant      = 'portrait',
  showProgress = false,
  onClick,
}) {
  const navigate   = useNavigate();
  const [hovered,  setHovered]  = useState(false);

  const progress = book.progress?.percentComplete ?? 0;

  const handleClick = () => {
    if (onClick) { onClick(book); return; }
    if (book.isExternal && book.fileUrl) { window.open(book.fileUrl, '_blank'); return; }
    if (book._id) navigate(`/home/books/${book._id}`);
  };

  /* ── Portrait card (default) ─────────────────────────────────────────── */
  if (variant === 'portrait') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          cursor: 'pointer',
          transition: 'transform 0.25s cubic-bezier(.22,1,.36,1)',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          outline: 'none',
        }}
      >
        {/* Cover */}
        <div style={{
          position: 'relative',
          aspectRatio: '2/3',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'linear-gradient(135deg,#FDF4F2,#ffd9dc)',
          boxShadow: hovered
            ? '0 20px 40px rgba(138,18,40,0.22), 0 4px 12px rgba(0,0,0,0.08)'
            : '0 4px 14px rgba(0,0,0,0.10)',
          transition: 'box-shadow 0.25s ease',
        }}>
          {/* Cover image */}
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.4s cubic-bezier(.22,1,.36,1)',
              }}
            />
          ) : (
            <Nocover title={book.title} />
          )}

          {/* Gradient overlay — always present for text legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(20,4,8,0.80) 0%, rgba(20,4,8,0.15) 50%, transparent 100%)',
            opacity: book.coverUrl ? 1 : 0,
          }} />

          {/* Category badge — top left */}
          {book.category && (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(201,168,76,0.92)',
              color: '#3d2900',
              fontSize: 9, fontWeight: 700,
              padding: '3px 7px', borderRadius: 6,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              backdropFilter: 'blur(4px)',
            }}>
              {book.category.length > 14 ? book.category.slice(0, 14) + '…' : book.category}
            </span>
          )}

          {/* External badge — top right */}
          {book.isExternal && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: 8, fontWeight: 700,
              padding: '3px 6px', borderRadius: 5,
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.06em',
              backdropFilter: 'blur(6px)',
            }}>
              EXT
            </span>
          )}

          {/* Progress bar — bottom strip */}
          {showProgress && progress > 0 && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 3, background: 'rgba(255,255,255,0.2)',
            }}>
              <div style={{
                height: '100%', background: '#B8964A',
                width: `${progress}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
          )}

          {/* Hover: play/open overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
              transform: hovered ? 'scale(1)' : 'scale(0.7)',
              transition: 'transform 0.25s cubic-bezier(.22,1,.36,1)',
            }}>
              <span className="material-symbols-outlined" style={{
                color: '#5C0F1F', fontSize: 20,
                fontVariationSettings: "'FILL' 1",
              }}>
                {book.isExternal ? 'open_in_new' : 'menu_book'}
              </span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div style={{ marginTop: 10, paddingLeft: 2, paddingRight: 2 }}>
          <p style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 13, fontWeight: 700,
            color: '#1a0609', lineHeight: 1.35,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            margin: 0,
          }}>
            {book.title}
          </p>
          {book.author && (
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 11, color: '#A89597',
              marginTop: 3, lineClamp: 1,
              whiteSpace: 'nowrap', overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {book.author}
            </p>
          )}
          {/* Progress text */}
          {showProgress && progress > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5, marginTop: 5,
            }}>
              <div style={{
                flex: 1, height: 3, background: '#ffd9dc', borderRadius: 99,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: '#5C0F1F', width: `${progress}%`,
                }} />
              </div>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 9,
                color: '#5C0F1F', fontWeight: 700,
              }}>
                {progress}%
              </span>
            </div>
          )}
          {/* Star rating */}
          {book.rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 11, color: '#B8964A', fontVariationSettings: "'FILL' 1",
              }}>star</span>
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: 10,
                color: '#6B5456', fontWeight: 600,
              }}>
                {book.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Landscape card (continue reading) ───────────────────────────────── */
  if (variant === 'landscape') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', gap: 16, padding: 16,
          background: '#ffffff',
          borderRadius: 16,
          cursor: 'pointer',
          boxShadow: hovered
            ? '0 12px 32px rgba(138,18,40,0.14)'
            : '0 2px 8px rgba(0,0,0,0.06)',
          border: '1px solid rgba(223,191,190,0.3)',
          transition: 'box-shadow 0.22s ease, transform 0.22s ease',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          outline: 'none',
        }}
      >
        {/* Cover */}
        <div style={{
          width: 72, height: 100, flexShrink: 0,
          borderRadius: 10, overflow: 'hidden',
          background: 'linear-gradient(135deg,#FDF4F2,#ffd9dc)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        }}>
          {book.coverUrl
            ? <img src={book.coverUrl} alt={book.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <Nocover title={book.title} size={20} />}
        </div>

        {/* Text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {book.category && (
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 700,
              color: '#5C0F1F', textTransform: 'uppercase', letterSpacing: '0.1em',
              marginBottom: 4,
            }}>
              {book.category}
            </span>
          )}
          <p style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: 15, fontWeight: 700, color: '#1a0609',
            lineHeight: 1.3, margin: '0 0 4px',
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {book.title}
          </p>
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 12,
            color: '#A89597', margin: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {book.author}
          </p>
          {/* Progress */}
          <div style={{ marginTop: 'auto', paddingTop: 10 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#6B5456',
              marginBottom: 4,
            }}>
              <span>Progress</span>
              <span style={{ fontWeight: 700, color: '#5C0F1F' }}>{progress}%</span>
            </div>
            <div style={{ height: 4, background: '#ffd9dc', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'linear-gradient(90deg,#5C0F1F,#B8964A)',
                width: `${progress}%`, transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          display: 'flex', alignItems: 'center',
          color: hovered ? '#5C0F1F' : '#EBD2CF',
          transition: 'color 0.2s ease',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
        </div>
      </div>
    );
  }

  /* ── Compact card (list search result) ───────────────────────────────── */
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', gap: 12, padding: '12px 14px',
        background: hovered ? '#FCE8E6' : '#ffffff',
        borderRadius: 12, cursor: 'pointer',
        border: '1px solid rgba(223,191,190,0.2)',
        transition: 'background 0.15s ease',
        outline: 'none',
      }}
    >
      <div style={{
        width: 44, height: 60, flexShrink: 0,
        borderRadius: 6, overflow: 'hidden',
        background: 'linear-gradient(135deg,#FDF4F2,#ffd9dc)',
      }}>
        {book.coverUrl
          ? <img src={book.coverUrl} alt={book.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <Nocover title={book.title} size={14} />}
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: 13, fontWeight: 700, color: '#1a0609',
          margin: '0 0 2px', lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {book.title}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#A89597', margin: 0,
        }}>
          {book.author}
        </p>
        {book.category && (
          <span style={{
            display: 'inline-block', marginTop: 5,
            background: '#FDF4F2', color: '#5C0F1F',
            fontSize: 9, fontWeight: 700, padding: '2px 6px',
            borderRadius: 4, fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            {book.category}
          </span>
        )}
      </div>
      {book.isExternal && (
        <span className="material-symbols-outlined" style={{
          fontSize: 16, color: '#A89597', alignSelf: 'center',
        }}>open_in_new</span>
      )}
    </div>
  );
}

function Nocover({ title = '', size = 28 }) {
  const initials = title.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg,#8A1228 0%,#5C0F1F 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 6,
    }}>
      <span style={{
        fontFamily: 'Playfair Display, Georgia, serif',
        fontSize: size * 1.2, fontWeight: 800, color: 'rgba(255,255,255,0.9)',
        letterSpacing: '-0.02em',
      }}>
        {initials || '?'}
      </span>
    </div>
  );
}
