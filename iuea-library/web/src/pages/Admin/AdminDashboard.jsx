import { useState }                 from 'react';
import { useQuery, useMutation }    from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link }  from 'react-router-dom';
import api   from '../../services/api';
import toast from 'react-hot-toast';

const fetchStats        = ()       => api.get('/admin/stats').then(r => r.data);
const fetchRecentBooks  = ()       => api.get('/admin/books', { params: { limit: 4, page: 1 } }).then(r => r.data);
const syncPodcastFeeds  = ()       => api.post('/admin/sync-patrons').then(r => r.data);
const sendPush          = (body)   => api.post('/admin/notifications/push', body).then(r => r.data);

const ROLES = [
  { value: '',        label: 'All Users'  },
  { value: 'student', label: 'Students'   },
  { value: 'admin',   label: 'Admins'     },
];

function PushNotificationPanel() {
  const [title,      setTitle]      = useState('');
  const [body,       setBody]       = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [open,       setOpen]       = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: sendPush,
    onSuccess: (data) => {
      toast.success(`Sent to ${data.sent ?? 0} device(s)`);
      setTitle(''); setBody(''); setOpen(false);
    },
    onError: () => toast.error('Failed to send notification'),
  });

  return (
    <section style={{ marginBottom: '2rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C0A0C', margin: 0 }}>
          Push Notifications
        </h4>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.5rem 1rem', borderRadius: 9999,
            background: open ? '#EBD2CF' : '#5C0F1F',
            color: open ? '#5C0F1F' : '#fff',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', fontWeight: 700,
            transition: 'background 0.15s',
          }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
            {open ? 'close' : 'send'}
          </span>
          {open ? 'Cancel' : 'Compose'}
        </button>
      </div>

      {open && (
        <div style={{
          background: '#fff', borderRadius: '1rem',
          border: '1px solid rgba(223,191,190,0.4)',
          boxShadow: '0 4px 20px rgba(138,18,40,0.08)',
          padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#6B5456', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                Title
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. New books available!"
                style={{ width: '100%', borderRadius: 8, border: '1.5px solid rgba(223,191,190,0.6)', padding: '0.6rem 0.875rem', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = '#5C0F1F')}
                onBlur={e => (e.target.style.borderColor = 'rgba(223,191,190,0.6)')}
              />
            </div>
            <div>
              <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#6B5456', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                Target Audience
              </label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                style={{ width: '100%', borderRadius: 8, border: '1.5px solid rgba(223,191,190,0.6)', padding: '0.6rem 0.875rem', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', outline: 'none', background: '#fff', boxSizing: 'border-box' }}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#6B5456', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
              Message
            </label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Write your notification message…"
              rows={3}
              style={{ width: '100%', borderRadius: 8, border: '1.5px solid rgba(223,191,190,0.6)', padding: '0.6rem 0.875rem', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = '#5C0F1F')}
              onBlur={e => (e.target.style.borderColor = 'rgba(223,191,190,0.6)')}
            />
          </div>

          <button
            onClick={() => { if (title.trim() && body.trim()) mutate({ title: title.trim(), body: body.trim(), targetRole: targetRole || undefined }); }}
            disabled={isPending || !title.trim() || !body.trim()}
            style={{
              alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.625rem 1.5rem', borderRadius: 9999, border: 'none',
              background: (!title.trim() || !body.trim()) ? '#EBD2CF' : '#5C0F1F',
              color: (!title.trim() || !body.trim()) ? '#A89597' : '#fff',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 700,
              cursor: (isPending || !title.trim() || !body.trim()) ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
              {isPending ? 'hourglass_empty' : 'send'}
            </span>
            {isPending ? 'Sending…' : 'Send Notification'}
          </button>
        </div>
      )}
    </section>
  );
}

// ── RecentBooks — real data from DB ──────────────────────────────────────────
function RecentBooks() {
  const { data, isLoading } = useQuery({
    queryKey:  ['admin', 'recent-books'],
    queryFn:   fetchRecentBooks,
    staleTime: 60_000,
  });
  const books = data?.books ?? [];

  return (
    <section style={{ paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#1C0A0C', margin: 0 }}>
          Recently Added Books
        </h4>
        <Link to="/admin/books" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#8A1228', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
          Manage All Books
        </Link>
      </div>

      {isLoading ? (
        <div className="ad-catalog-grid">
          {[0,1,2,3].map(i => (
            <div key={i} style={{ aspectRatio: '3/4', borderRadius: '0.75rem', background: 'linear-gradient(90deg,#FDF4F2 25%,#ffe1e3 50%,#FDF4F2 75%)', backgroundSize: '200% 100%', animation: 'ad-shimmer 1.4s infinite' }} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#FDF4F2', borderRadius: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#EBD2CF', display: 'block', marginBottom: '0.75rem' }}>library_books</span>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#A89597', fontSize: '0.875rem', margin: 0 }}>
            No books in DB yet — run <code style={{ background: '#FCE8E6', padding: '2px 6px', borderRadius: 4 }}>npm run seed</code> or import via the Books page.
          </p>
        </div>
      ) : (
        <div className="ad-catalog-grid">
          {books.map((b, i) => (
            <div key={b.id} className="ad-catalog-card" style={{ transform: i % 2 === 1 ? 'translateY(2rem)' : 'none' }}>
              {b.coverUrl
                ? <img className="ad-catalog-img" src={b.coverUrl} alt={b.title} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#8A1228,#5C0F1F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '4rem' }}>book</span>
                  </div>
              }
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(138,18,40,0.85) 0%, transparent 55%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.25rem' }}>
                <p style={{ fontSize: 9, color: 'rgba(255,209,212,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{b.category}</p>
                <h5 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, margin: 0 }}>{b.title}</h5>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(255,209,212,0.7)', margin: '4px 0 0' }}>{b.author}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes ad-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </section>
  );
}

const STAT_CARDS = [
  { key: 'books',         label: 'Total Books',     icon: 'menu_book', color: '#B8964A' },
  { key: 'users',         label: 'Active Users',    icon: 'person',    color: '#5C0F1F' },
  { key: 'completedBooks',label: 'Books Completed', icon: 'task_alt',  color: '#388e3c' },
  { key: 'podcasts',      label: 'Live Podcasts',   icon: 'podcasts',  color: '#B8964A' },
];

export default function AdminDashboard() {
  const [lastSync, setLastSync] = useState(null);

  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchStats, staleTime: 30_000 });
  const { mutate: sync, isPending: syncing } = useMutation({
    mutationFn: syncPodcastFeeds,
    onSuccess: () => { toast.success('Podcast feeds refreshed.'); setLastSync(new Date()); refetch(); },
    onError:   () => toast.error('Sync failed.'),
  });

  const stats       = data?.stats        ?? {};
  const readers     = data?.dailyReaders ?? [];
  const recentUsers = data?.recentUsers  ?? [];

  return (
    <>
      <style>{`
        .ad-stat-card { background: #ffffff; padding: 1.5rem; border-radius: 0.75rem; display: flex; flex-direction: column; justify-content: space-between; height: 160px; transition: transform 0.2s; cursor: default; }
        .ad-stat-card:hover { transform: scale(1.02); }
        .ad-catalog-card { aspect-ratio: 3/4; background: #FCE8E6; border-radius: 0.75rem; overflow: hidden; position: relative; }
        .ad-catalog-card:hover .ad-catalog-img { transform: scale(1.1); }
        .ad-catalog-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
        .ad-stats-grid { display: grid; grid-template-columns: repeat(1,1fr); gap: 1.5rem; }
        @media(min-width:768px)  { .ad-stats-grid { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:1024px) { .ad-stats-grid { grid-template-columns: repeat(4,1fr); } }
        .ad-analytics-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
        @media(min-width:1024px) { .ad-analytics-grid { grid-template-columns: repeat(3,1fr); } }
        .ad-catalog-grid { display: grid; grid-template-columns: repeat(1,1fr); gap: 1rem; }
        @media(min-width:768px)  { .ad-catalog-grid { grid-template-columns: repeat(2,1fr); } }
        @media(min-width:1024px) { .ad-catalog-grid { grid-template-columns: repeat(4,1fr); } }
      `}</style>

      {/* p-8 space-y-10 */}
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

        {/* ── Hero Section ── */}
        <section style={{ maxWidth: '72rem' }}>
          {/* font-headline text-5xl lg:text-6xl text-on-background leading-tight max-w-2xl mb-4 */}
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2.5rem,5vw,3.75rem)', fontWeight: 700, color: '#1C0A0C', lineHeight: 1.15, maxWidth: '42rem', marginBottom: '1rem' }}>
            Refining the{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#5C0F1F' }}>Knowledge</span>
            {' '}Landscape.
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#6B5456', maxWidth: '36rem', fontSize: '1.125rem', opacity: 0.8 }}>
            Monitor university engagement metrics, curated collections, and library infrastructure in real-time.
          </p>
        </section>

        {/* ── Stats Grid ── */}
        <section className="ad-stats-grid">
          {STAT_CARDS.map(({ key, label, icon, color }) => (
            <div key={key} className="ad-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined"
                  style={{ background: '#ffdad9', padding: 8, borderRadius: '0.5rem', color: '#8A1228', fontVariationSettings: "'FILL' 1", fontSize: '1.25rem' }}>
                  {icon}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B5456', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </p>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.875rem', fontWeight: 700, color: '#1C0A0C', marginTop: 4 }}>
                  {isLoading ? '–' : (stats[key] != null ? Number(stats[key]).toLocaleString() : '0')}
                </h3>
              </div>
            </div>
          ))}
        </section>

        {/* ── Analytics + Activity ── */}
        <section className="ad-analytics-grid">

          {/* Chart: lg:col-span-2 */}
          <div style={{ gridColumn: 'span 1' }} className="ad-chart-col">
            <style>{`@media(min-width:1024px){.ad-chart-col{grid-column:span 2;}}`}</style>
            <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                <div>
                  <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C0A0C', marginBottom: 4 }}>
                    Daily Active Users
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>
                    Past 30 days performance
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#5C0F1F', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.75rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>Unique Sessions</span>
                </div>
              </div>

              {readers.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={readers} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FDF4F2" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B5456' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#6B5456' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #EBD2CF' }} formatter={v => [v, 'Readers']} />
                    <Line type="monotone" dataKey="count" stroke="#5C0F1F" strokeWidth={3} strokeLinecap="round" dot={{ fill: '#B8964A', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#B8964A' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                /* Static SVG path chart (matches HTML design when no data) */
                <div style={{ position: 'relative', height: 300, width: '100%' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                    {[0,1,2,3,4].map(i => <div key={i} style={{ width: '100%', borderBottom: '1px solid rgba(255,233,234,0.7)' }} />)}
                  </div>
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g-maroon" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#5C0F1F" stopOpacity="1" />
                        <stop offset="100%" stopColor="#5C0F1F" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,250 Q50,220 100,240 T200,180 T300,210 T400,140 T500,160 T600,80 T700,120 T800,90 T900,100" fill="none" stroke="#5C0F1F" strokeLinecap="round" strokeWidth="3" />
                    <path d="M0,250 Q50,220 100,240 T200,180 T300,210 T400,140 T500,160 T600,80 T700,120 T800,90 T900,100 V300 H0 Z" fill="url(#g-maroon)" opacity="0.1" />
                  </svg>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6B5456', fontFamily: 'Inter, sans-serif', paddingTop: 16, transform: 'translateY(1.5rem)' }}>
                    {['Oct 01', 'Oct 10', 'Oct 20', 'Oct 30'].map(d => <span key={d}>{d}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#FCE8E6', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(223,191,190,0.15)' }}>
            <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#1C0A0C', marginBottom: '1.5rem' }}>
              Recent Activity
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {recentUsers.length > 0 ? recentUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(107,15,26,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {u.avatar
                      ? <img src={u.avatar} alt={u.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      : <span className="material-symbols-outlined" style={{ color: '#5C0F1F', fontSize: '1rem' }}>person</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#1C0A0C', margin: 0 }}>{u.name}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6B5456', margin: 0 }}>{u.email}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(138,18,40,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                      {u.faculty ?? u.role} · {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) : (
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#A89597', textAlign: 'center', padding: '1rem 0' }}>
                  No users yet. Run the seed script or register the first user.
                </p>
              )}
            </div>
            <button
              onClick={() => sync()}
              disabled={syncing}
              style={{ width: '100%', marginTop: '2.5rem', padding: '0.75rem', border: '1px solid rgba(107,15,26,0.3)', color: '#5C0F1F', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', cursor: syncing ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: syncing ? 0.6 : 1, transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={e => { if (!syncing) { e.currentTarget.style.background = '#5C0F1F'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5C0F1F'; }}
            >
              {syncing ? 'Syncing RSS Feeds…' : (lastSync ? `Synced ${Math.round((Date.now() - lastSync) / 60000)}m ago — Refresh Podcasts` : 'Refresh Podcast Feeds')}
            </button>
          </div>
        </section>

        {/* ── Push Notification Composer ── */}
        <PushNotificationPanel />

        {/* ── Recently Added Books ── */}
        <RecentBooks />

        {/* ── Footer ── */}
        <footer style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(223,191,190,0.3)' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Privacy', 'Terms', 'Translate', 'Books API'].map(t => (
              <a key={t} href="#" style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(138,18,40,0.5)', textDecoration: 'none' }}>
                {t}
              </a>
            ))}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(138,18,40,0.4)', margin: 0 }}>
            Powered by Google • IUEA Library Management System v4.2
          </p>
        </footer>
      </div>
    </>
  );
}
