import { useState }                 from 'react';
import { useQuery, useMutation }    from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api   from '../../services/api';
import toast from 'react-hot-toast';

const fetchStats = () => api.get('/admin/stats').then(r => r.data);
const runSync    = () => api.post('/admin/sync-koha', { q: '', limit: 500 }).then(r => r.data);

const STAT_CARDS = [
  { key: 'books',     label: 'Total Books',      icon: 'menu_book', delta: '+12%',  deltaColor: '#c9a84c', deltaBg: 'rgba(201,168,76,0.1)',  fallback: '42,892' },
  { key: 'users',     label: 'Active Users',      icon: 'person',    delta: '+4.2k', deltaColor: '#7b0d1e', deltaBg: 'rgba(123,13,30,0.1)',   fallback: '12,450' },
  { key: 'downloads', label: 'Downloads Today',   icon: 'download',  delta: '-2%',   deltaColor: '#ba1a1a', deltaBg: 'rgba(186,26,26,0.1)',   fallback: '1,830'  },
  { key: 'podcasts',  label: 'Podcast Plays',     icon: 'podcasts',  delta: '+22%',  deltaColor: '#c9a84c', deltaBg: 'rgba(201,168,76,0.1)',  fallback: '5,204'  },
];

const ACTIVITY = [
  { icon: 'add_circle',  iconColor: '#7b0d1e', iconBg: 'rgba(123,13,30,0.1)',  title: 'New Book Cataloged',    desc: '"The Architecture of Thought" by Dr. Julian Vane',   time: '2 MINS AGO'   },
  { icon: 'person_add',  iconColor: '#c9a84c', iconBg: 'rgba(201,168,76,0.1)', title: 'New Student Joined',    desc: 'Sarah Jenkins (Faculty of Engineering)',              time: '15 MINS AGO'  },
  { icon: 'play_circle', iconColor: '#7b0d1e', iconBg: 'rgba(123,13,30,0.1)',  title: 'Trending Podcast',       desc: '"Ethics in AI" reached 500+ streams',                time: '1 HOUR AGO'   },
  { icon: 'history',     iconColor: '#56000f', iconBg: '#ffd9dc',              title: 'System Audit',           desc: 'Weekly database synchronization completed',          time: '3 HOURS AGO'  },
];

const CATALOG = [
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCrVwk4oqhP_VGa7Z9CkbytQ8pmeMOhbyVnivOZtkvE-0ZapSuimLKagFD9WmcVRQtXkUyq2meHS231g0CXqP_5_H0l9Zt_TdqHFkV8hVQDXkE4WiO0u7_SBB-fdElJw-a9Ipz_wIUtK6eXweG350fYKG9qailX4-U8qRSajcn5RDl1TTeji1rujMSzWcF7p1zJUMwk_B1qXhXggN9BDP9i9bnqtmRHyKHaqCasS2Xi1rH3aOOyYVaDRx7ToXVxWeCSijM0bSK_Ajw', genre: 'Poetry',     title: 'The Subtle Art of Resonance', offset: false },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAABSVPM7rPbnqsEZhm991u8F2F29QJ3fFHUXFMRWV73TT1ZZGfUfiQWpP6aS78NklHJza82yzqwwStYMlb8f6LWgogGOZE7Eg5DB3owpYcZx7SPuqU1_0eqwfjXIg7SGrhL6iFuqd-fBtLZXKABrIswEpVWyovs_0vhSiKzZJ96B2FX-95zzozO5Y59o_O0sLmhFEn-9l3OtTkmLeykRD4un7bwGRb_viYRdE3va2__TeDxqctvs-Bttr60qbFEC-QPr9LCwWcCjg', genre: 'History',    title: 'East African Civilizations',   offset: true  },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAIO_x5qSk8Y7h87OApbcccI5AIbE3TngUNtNt5chFv7dmR_L4Z1pXGn6Tz6fCrpzqlVbSoRuzBnlTRTg6JGPjGJZsirznLzNthnn2MzVr3yLwgGlhjFQn_QATCFcFFbMocN1Th0BRBzHFBJTkHA5kvopobjPh1XyEwRsiU3X6lMG4R8VXKgGNqwIhsohcX7sJs0S13EOV9hZlpr4dS2RGw4sw8S8SF6H0IYuJFZLw47jSXG_sTimCYXvAVfqQ9HmgPiby6YgWevpc', genre: 'Philosophy', title: 'Existential Curatorship',       offset: false },
  { img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDl-yWwx1Cw3RuKj5-o60-8EtWgF1lpa_3_pEmOFgh3meTpkbQ1CKJlfW0N6yGghPzkupXz9oR6JHJX5N0nj_3e2K2IGUk___Gp0NsIv67ds0w7OcjrvN77-Wpeu_VWVJJ7tXZOmm8kcefEYbDJqO4x3Inj9EZrR1HO5AMJxAag6ZhfUyudNzmwgz1iGmvfOZ84GhI9k3XeTK_SjgfTnV3h-djvWrpTksRFib4Db6aEoFXUbM4Pa0wnJdg-BYegKxZfVx1EM8SRSEE', genre: 'Technology', title: 'Digital Archives 2.0',           offset: true  },
];

export default function AdminDashboard() {
  const [lastSync, setLastSync] = useState(null);

  const { data, isLoading, refetch } = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchStats, staleTime: 30_000 });
  const { mutate: sync, isPending: syncing } = useMutation({
    mutationFn: runSync,
    onSuccess: res => { toast.success(res.message); setLastSync(new Date()); refetch(); },
    onError: () => toast.error('Koha sync failed.'),
  });

  const stats       = data?.stats        ?? {};
  const readers     = data?.dailyReaders ?? [];
  const recentUsers = data?.recentUsers  ?? [];

  return (
    <>
      <style>{`
        .ad-stat-card { background: #ffffff; padding: 1.5rem; border-radius: 0.75rem; display: flex; flex-direction: column; justify-content: space-between; height: 160px; transition: transform 0.2s; cursor: default; }
        .ad-stat-card:hover { transform: scale(1.02); }
        .ad-catalog-card { aspect-ratio: 3/4; background: #fff0f0; border-radius: 0.75rem; overflow: hidden; position: relative; }
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
          <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: 'clamp(2.5rem,5vw,3.75rem)', fontWeight: 700, color: '#2d1418', lineHeight: 1.15, maxWidth: '42rem', marginBottom: '1rem' }}>
            Refining the{' '}
            <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#7b0d1e' }}>Knowledge</span>
            {' '}Landscape.
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#584141', maxWidth: '36rem', fontSize: '1.125rem', opacity: 0.8 }}>
            Monitor university engagement metrics, curated collections, and library infrastructure in real-time.
          </p>
        </section>

        {/* ── Stats Grid ── */}
        <section className="ad-stats-grid">
          {STAT_CARDS.map(({ key, label, icon, delta, deltaColor, deltaBg, fallback }) => (
            <div key={key} className="ad-stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* icon: bg-primary-fixed p-2 rounded-lg */}
                <span className="material-symbols-outlined"
                  style={{ background: '#ffdad9', padding: 8, borderRadius: '0.5rem', color: '#56000f', fontVariationSettings: "'FILL' 1", fontSize: '1.25rem' }}>
                  {icon}
                </span>
                {/* delta badge */}
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: deltaColor, background: deltaBg, padding: '2px 8px', borderRadius: '0.25rem' }}>
                  {delta}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#584141', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </p>
                {/* font-headline text-3xl font-bold */}
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.875rem', fontWeight: 700, color: '#2d1418', marginTop: 4 }}>
                  {isLoading ? '–' : (stats[key] != null ? Number(stats[key]).toLocaleString() : fallback)}
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
                  <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#2d1418', marginBottom: 4 }}>
                    Daily Active Users
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: '#584141', fontFamily: 'Inter, sans-serif' }}>
                    Past 30 days performance
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#7b0d1e', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.75rem', color: '#584141', fontFamily: 'Inter, sans-serif' }}>Unique Sessions</span>
                </div>
              </div>

              {readers.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={readers} margin={{ top: 4, right: 8, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffe9ea" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#584141' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#584141' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #dfbfbe' }} formatter={v => [v, 'Readers']} />
                    <Line type="monotone" dataKey="count" stroke="#7b0d1e" strokeWidth={3} strokeLinecap="round" dot={{ fill: '#c9a84c', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#c9a84c' }} />
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
                        <stop offset="0%" stopColor="#7b0d1e" stopOpacity="1" />
                        <stop offset="100%" stopColor="#7b0d1e" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,250 Q50,220 100,240 T200,180 T300,210 T400,140 T500,160 T600,80 T700,120 T800,90 T900,100" fill="none" stroke="#7b0d1e" strokeLinecap="round" strokeWidth="3" />
                    <path d="M0,250 Q50,220 100,240 T200,180 T300,210 T400,140 T500,160 T600,80 T700,120 T800,90 T900,100 V300 H0 Z" fill="url(#g-maroon)" opacity="0.1" />
                  </svg>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#584141', fontFamily: 'Inter, sans-serif', paddingTop: 16, transform: 'translateY(1.5rem)' }}>
                    {['Oct 01', 'Oct 10', 'Oct 20', 'Oct 30'].map(d => <span key={d}>{d}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ background: '#fff0f0', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(223,191,190,0.15)' }}>
            <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#2d1418', marginBottom: '1.5rem' }}>
              Recent Activity
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {recentUsers.length > 0 ? recentUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(123,13,30,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {u.avatar
                      ? <img src={u.avatar} alt={u.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      : <span className="material-symbols-outlined" style={{ color: '#7b0d1e', fontSize: '1rem' }}>person</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#2d1418', margin: 0 }}>{u.name}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#584141', margin: 0 }}>{u.email}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(86,0,15,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                      {u.faculty ?? u.role} · {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) : ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ color: a.iconColor, fontSize: '1rem' }}>{a.icon}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#2d1418', margin: 0 }}>{a.title}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#584141', margin: 0 }}>{a.desc}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(86,0,15,0.5)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => sync()}
              disabled={syncing}
              style={{ width: '100%', marginTop: '2.5rem', padding: '0.75rem', border: '1px solid rgba(123,13,30,0.3)', color: '#7b0d1e', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', background: 'none', cursor: syncing ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: syncing ? 0.6 : 1, transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={e => { if (!syncing) { e.currentTarget.style.background = '#7b0d1e'; e.currentTarget.style.color = '#fff'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#7b0d1e'; }}
            >
              {syncing ? 'Syncing Koha…' : (lastSync ? `Synced ${Math.round((Date.now() - lastSync) / 60000)}m ago — Sync Again` : 'View Full Logs')}
            </button>
          </div>
        </section>

        {/* ── Featured Catalog Items ── */}
        <section style={{ paddingBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#2d1418', margin: 0 }}>
              Featured Catalog Items
            </h4>
            <a href="#" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#56000f', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={e => (e.target.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.target.style.textDecoration = 'none')}>
              Manage All Catalogues
            </a>
          </div>
          <div className="ad-catalog-grid">
            {CATALOG.map((c, i) => (
              <div key={i} className="ad-catalog-card" style={{ transform: c.offset ? 'translateY(2rem)' : 'none' }}>
                <img className="ad-catalog-img" src={c.img} alt={c.title} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(86,0,15,0.8) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.5rem' }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,209,212,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{c.genre}</p>
                  <h5 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.125rem', fontWeight: 700, color: '#ffffff', lineHeight: 1.3, margin: 0 }}>{c.title}</h5>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(223,191,190,0.3)' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            {['Privacy', 'Terms', 'Translate', 'Books API'].map(t => (
              <a key={t} href="#" style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(86,0,15,0.5)', textDecoration: 'none' }}>
                {t}
              </a>
            ))}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: 'rgba(86,0,15,0.4)', margin: 0 }}>
            Powered by Google • IUEA Library Management System v4.2
          </p>
        </footer>
      </div>
    </>
  );
}
