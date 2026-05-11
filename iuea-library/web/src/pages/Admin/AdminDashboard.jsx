import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import api        from '../../services/api';
import toast      from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// ── API ───────────────────────────────────────────────────────────────────────
const fetchStats       = () => api.get('/admin/stats').then(r => r.data);
const fetchRecentBooks = () => api.get('/admin/books', { params: { limit: 8, page: 1 } }).then(r => r.data);
const syncPodcastFeeds = () => api.post('/admin/sync-podcasts').then(r => r.data);
const sendPush         = (b) => api.post('/admin/notifications/push', b).then(r => r.data);

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY      = '#E11D48';
const PRIMARY_LIGHT = '#FFF1F4';

const DONUT_COLORS = ['#E11D48', '#6366F1', '#10B981', '#F59E0B'];

const STAT_CARDS = [
  { key: 'books',          label: 'Total Books',      icon: 'menu_book',    color: PRIMARY,    bg: PRIMARY_LIGHT,  spark: [4,6,5,8,7,9,11,10,13,15] },
  { key: 'users',          label: 'Active Users',     icon: 'group',        color: '#6366F1',  bg: '#EEF2FF',      spark: [3,5,4,8,6,9,10,12,11,14] },
  { key: 'downloadsToday', label: 'Downloads Today',  icon: 'download',     color: '#10B981',  bg: '#ECFDF5',      spark: [8,6,9,5,10,7,12,8,14,11] },
  { key: 'podcastPlays',   label: 'Podcast Plays',    icon: 'podcasts',     color: '#F59E0B',  bg: '#FFFBEB',      spark: [2,4,3,6,5,7,6,9,8,11] },
];

const BOOK_CATEGORIES = ['Engineering', 'Law', 'Business', 'Science', 'Medicine', 'IT', 'Education', 'Social Sciences'];

const ROLES = [
  { value: '',        label: 'All Users' },
  { value: 'student', label: 'Students'  },
  { value: 'admin',   label: 'Admins'    },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function greeting(name) {
  const h = new Date().getHours();
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${g}, ${name?.split(' ')[0] ?? 'Admin'} 👋`;
}

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Number(n).toLocaleString();
}

// ── Mini Sparkline ────────────────────────────────────────────────────────────
function Sparkline({ data, color }) {
  const pts = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={80} height={36}>
      <AreaChart data={pts} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#sg-${color.replace('#','')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── Custom chart tooltip ──────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0F172A', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6 }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value?.toLocaleString()}</div>
    </div>
  );
}

// ── Donut center label ────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
      <tspan x={cx} dy="-6" fontSize={22} fontWeight={700} fill="#0F172A">{fmt(total)}</tspan>
      <tspan x={cx} dy={20} fontSize={11} fill="#94A3B8">Users</tspan>
    </text>
  );
}

// ── Push notification panel ───────────────────────────────────────────────────
function PushPanel() {
  const [title, setTitle] = useState('');
  const [body,  setBody]  = useState('');
  const [role,  setRole]  = useState('');
  const [open,  setOpen]  = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: sendPush,
    onSuccess: (d) => { toast.success(`Sent to ${d.sent ?? 0} device(s)`); setTitle(''); setBody(''); setOpen(false); },
    onError:   () => toast.error('Failed to send'),
  });

  return (
    <div className="db-card">
      <div style={{ padding: '1.125rem 1.25rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: PRIMARY, fontVariationSettings: "'FILL' 1" }}>notifications_active</span>
          <span className="db-card-title">Push Notification</span>
        </div>
        <button onClick={() => setOpen(o => !o)} className="db-pill-btn">
          <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>{open ? 'close' : 'add'}</span>
          {open ? 'Cancel' : 'Compose'}
        </button>
      </div>

      {open ? (
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="db-input" />
          <select value={role} onChange={e => setRole(e.target.value)} className="db-input">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message…" rows={3} className="db-input" style={{ resize: 'vertical' }} />
          <button
            onClick={() => { if (title.trim() && body.trim()) mutate({ title: title.trim(), body: body.trim(), targetRole: role || undefined }); }}
            disabled={isPending || !title.trim() || !body.trim()}
            className="db-primary-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>{isPending ? 'hourglass_empty' : 'send'}</span>
            {isPending ? 'Sending…' : 'Send Now'}
          </button>
        </div>
      ) : (
        <div style={{ padding: '1.25rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#E2E8F0', display: 'block', marginBottom: 8 }}>mark_chat_unread</span>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Send a push notification to all students or specific groups.</p>
        </div>
      )}
    </div>
  );
}

// ── Recent books table ────────────────────────────────────────────────────────
function RecentBooksTable() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'recent-books'],
    queryFn:  fetchRecentBooks,
    staleTime: 60_000,
  });

  const books = (data?.books ?? []).filter(b =>
    !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.author?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="db-card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="db-card-title">Recent Books</span>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.875rem', color: '#94A3B8', pointerEvents: 'none' }}>search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '0.35rem 0.75rem 0.35rem 1.875rem', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', outline: 'none', width: 160 }}
            />
          </div>
          <button className="db-ghost-btn">
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>filter_list</span>
            Filter
          </button>
          <Link to="/admin/books" className="db-ghost-btn" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>open_in_new</span>
            View all
          </Link>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[0,1,2,3,4].map(i => <div key={i} className="db-skeleton" style={{ height: 44, borderRadius: 8 }} />)}
        </div>
      ) : books.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#E2E8F0', display: 'block', marginBottom: 8 }}>library_books</span>
          <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>No books yet. Run the seed script.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="db-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Book</th>
                <th>Author</th>
                <th>Category</th>
                <th>Format</th>
                <th>Status</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {books.map((b, idx) => (
                <tr key={b.id} className="db-tr">
                  <td style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {b.coverUrl
                        ? <img src={b.coverUrl} alt="" style={{ width: 30, height: 38, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                        : <div style={{ width: 30, height: 38, borderRadius: 4, background: `linear-gradient(135deg, ${PRIMARY}, #FB7185)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>book</span>
                          </div>
                      }
                      <span style={{ fontWeight: 500, color: '#0F172A', fontSize: '0.8125rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748B', fontSize: '0.8125rem' }}>{b.author}</td>
                  <td><span className="db-badge db-badge-blue">{b.category}</span></td>
                  <td><span className="db-badge db-badge-gray" style={{ textTransform: 'uppercase', fontSize: '0.6875rem' }}>{b.fileFormat ?? '—'}</span></td>
                  <td>
                    <span className="db-status-dot" style={{ '--c': b.isActive ? '#10B981' : '#94A3B8' }}>
                      {b.isActive ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td style={{ color: '#94A3B8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    {new Date(b.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [period,       setPeriod]      = useState('month');
  const [autoRefresh,  setAutoRefresh] = useState(false);
  const [selectedYear, setSelectedYear]= useState(new Date().getFullYear());
  const [lastSync,     setLastSync]    = useState(null);
  const timerRef = useRef(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey:  ['admin', 'stats', selectedYear],
    queryFn:   fetchStats,
    staleTime: 30_000,
  });

  // Auto-refresh every 30 s when enabled
  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(() => refetch(), 30_000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [autoRefresh, refetch]);
  const { mutate: sync, isPending: syncing } = useMutation({
    mutationFn: syncPodcastFeeds,
    onSuccess: () => { toast.success('Podcast feeds refreshed.'); setLastSync(new Date()); refetch(); },
    onError:   () => toast.error('Sync failed.'),
  });

  const stats       = data?.stats        ?? {};
  const readers     = data?.dailyReaders ?? [];
  const recentUsers = data?.recentUsers  ?? [];

  // Build reading activity for bar chart — books per category (seeded/static for display)
  const categoryData = useMemo(() => {
    const counts = { Engineering: 24, Business: 18, Science: 15, Law: 12, Medicine: 10, IT: 22, Education: 8, 'Social Sciences': 6 };
    if (stats.books > 0) {
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const scale = stats.books / total;
      return BOOK_CATEGORIES.map(name => ({ name: name.length > 10 ? name.slice(0,8)+'…' : name, count: Math.round(counts[name] * scale) }));
    }
    return BOOK_CATEGORIES.map(name => ({ name: name.length > 10 ? name.slice(0,8)+'…' : name, count: counts[name] }));
  }, [stats.books]);

  // Donut data — user roles
  const studentCount = recentUsers.filter(u => u.role === 'student').length;
  const adminCount   = recentUsers.filter(u => u.role === 'admin').length;
  const otherCount   = recentUsers.length - studentCount - adminCount;
  const donutTotal   = stats.users ?? recentUsers.length;
  const donutData    = [
    { name: 'Students',  value: studentCount || Math.round((donutTotal || 10) * 0.72) },
    { name: 'Admins',    value: adminCount   || Math.round((donutTotal || 10) * 0.08) },
    { name: 'Others',    value: otherCount   || Math.round((donutTotal || 10) * 0.20) },
  ];

  // Last 7 days of reader data for mini charts
  const last7 = readers.slice(-7).map(r => r.count);
  const sparkDataForKey = (key) => {
    const s = STAT_CARDS.find(c => c.key === key);
    return s?.spark ?? last7;
  };

  // Period-filtered readers for the area chart
  const filteredReaders = useMemo(() => {
    if (period === 'week')  return readers.slice(-7);
    if (period === 'year') {
      const monthly = {};
      readers.forEach(r => {
        const m = r.date?.slice(0, 7);
        if (m) monthly[m] = (monthly[m] || 0) + (r.count || 0);
      });
      return Object.entries(monthly).map(([date, count]) => ({ date, count }));
    }
    return readers.slice(-30);
  }, [readers, period]);

  const today     = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });

  return (
    <>
      {/* SVG pattern defs — referenced by recharts bars */}
      <svg width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}>
        <defs>
          <pattern id="bar-stripe" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
            <rect width="6" height="6" fill={PRIMARY_LIGHT} />
            <rect width="3" height="6" fill={PRIMARY} opacity="0.75" />
          </pattern>
          <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={PRIMARY}  stopOpacity="1" />
            <stop offset="100%" stopColor="#FB7185"  stopOpacity="0.6" />
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .db-root {
          padding: 1.75rem 1.75rem 4rem;
          display: flex; flex-direction: column; gap: 1.5rem;
          font-family: 'Inter', sans-serif;
          max-width: 1500px;
        }

        /* ── KPI cards ── */
        .db-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
        @media(max-width:1200px){ .db-kpi-grid{ grid-template-columns: repeat(2,1fr); } }
        @media(max-width:640px) { .db-kpi-grid{ grid-template-columns: 1fr; } }

        .db-kpi {
          background: #fff; border: 1px solid #E2E8F0; border-radius: 12px;
          padding: 1.125rem 1.25rem 1rem;
          display: flex; justify-content: space-between; align-items: flex-end;
          gap: 1rem; transition: box-shadow 0.15s, transform 0.15s;
        }
        .db-kpi:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .db-kpi-left { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; min-width: 0; }
        .db-kpi-top  { display: flex; align-items: center; gap: 6px; }
        .db-kpi-icon-wrap { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .db-kpi-icon-wrap .material-symbols-outlined { font-size: 1rem; font-variation-settings: "'FILL' 1"; }
        .db-kpi-label { font-size: 0.75rem; color: #64748B; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .db-kpi-val   { font-size: 1.625rem; font-weight: 700; color: #0F172A; letter-spacing: -0.03em; line-height: 1; }
        .db-kpi-sub   { display: flex; align-items: center; gap: 4px; }
        .db-kpi-trend { font-size: 0.6875rem; font-weight: 700; padding: 2px 7px; border-radius: 999px; }
        .db-kpi-trend.up   { background: #ECFDF5; color: #059669; }
        .db-kpi-trend.down { background: #FFF1F4; color: #E11D48; }
        .db-kpi-vs { font-size: 0.6875rem; color: #94A3B8; }

        /* ── Generic card ── */
        .db-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 12px; }
        .db-card-title { font-size: 0.875rem; font-weight: 600; color: #0F172A; }

        /* ── Grid rows ── */
        .db-row-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem; }
        .db-row-3-2 { display: grid; grid-template-columns: 3fr 2fr; gap: 1.25rem; }
        @media(max-width:1100px){ .db-row-2-1, .db-row-3-2 { grid-template-columns: 1fr; } }

        /* ── Table ── */
        .db-table { width: 100%; border-collapse: collapse; font-size: 0.8125rem; }
        .db-table th {
          text-align: left; padding: 0.625rem 1.25rem;
          font-size: 0.6875rem; font-weight: 700; color: #94A3B8;
          text-transform: uppercase; letter-spacing: 0.08em;
          background: #FAFAFA; border-bottom: 1px solid #F1F5F9;
          white-space: nowrap;
        }
        .db-table td { padding: 0.75rem 1.25rem; border-bottom: 1px solid #F8FAFC; vertical-align: middle; }
        .db-table tbody tr:last-child td { border-bottom: none; }
        .db-tr:hover td { background: #FAFAFE; }

        /* ── Badges ── */
        .db-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 0.6875rem; font-weight: 600; }
        .db-badge-blue { background: #EEF2FF; color: #4338CA; }
        .db-badge-rose { background: ${PRIMARY_LIGHT}; color: ${PRIMARY}; }
        .db-badge-green { background: #ECFDF5; color: #059669; }
        .db-badge-gray { background: #F1F5F9; color: #475569; }

        .db-status-dot {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.8125rem; color: #475569;
        }
        .db-status-dot::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex-shrink: 0; }

        /* ── Skeleton ── */
        .db-skeleton { background: linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%); background-size: 200% 100%; animation: db-shimmer 1.4s infinite; }
        @keyframes db-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* ── Buttons ── */
        .db-primary-btn {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; padding: 0.5625rem 1rem; border: none; border-radius: 8px;
          cursor: pointer; background: ${PRIMARY}; color: #fff;
          font-size: 0.8125rem; font-weight: 600; font-family: 'Inter',sans-serif;
          transition: background 0.12s;
        }
        .db-primary-btn:hover:not(:disabled) { background: #be1239; }
        .db-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .db-ghost-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.35rem 0.75rem; border-radius: 8px;
          border: 1px solid #E2E8F0; background: #fff;
          font-size: 0.75rem; font-weight: 500; color: #475569;
          cursor: pointer; font-family: 'Inter',sans-serif; text-decoration: none;
          transition: background 0.12s;
        }
        .db-ghost-btn:hover { background: #F8FAFC; }

        .db-pill-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 0.3rem 0.75rem; border-radius: 999px;
          border: 1px solid #E2E8F0; background: #fff;
          font-size: 0.75rem; font-weight: 600; color: #475569;
          cursor: pointer; font-family: 'Inter',sans-serif;
          transition: background 0.12s, border-color 0.12s;
        }
        .db-pill-btn:hover { border-color: ${PRIMARY}; color: ${PRIMARY}; }

        /* ── Input ── */
        .db-input {
          width: 100%; border: 1px solid #E2E8F0; border-radius: 8px;
          padding: 0.5rem 0.75rem; font-size: 0.8125rem;
          font-family: 'Inter',sans-serif; outline: none;
          background: #fff; color: #0F172A; box-sizing: border-box;
          transition: border-color 0.12s;
        }
        .db-input:focus { border-color: ${PRIMARY}; box-shadow: 0 0 0 3px rgba(225,29,72,0.08); }
        .db-input::placeholder { color: #CBD5E1; }

        /* ── Toggle ── */
        .db-toggle {
          width: 34px; height: 19px; border-radius: 999px;
          background: #E2E8F0; border: none; cursor: pointer;
          position: relative; transition: background 0.15s; flex-shrink: 0;
        }
        .db-toggle.on { background: ${PRIMARY}; }
        .db-toggle::after {
          content: ''; position: absolute; top: 2px; left: 2px;
          width: 15px; height: 15px; border-radius: 50%;
          background: #fff; transition: left 0.15s;
        }
        .db-toggle.on::after { left: 17px; }

        /* ── Period tabs ── */
        .db-period-tabs { display: flex; background: #F1F5F9; border-radius: 8px; padding: 3px; gap: 2px; }
        .db-period-tab {
          padding: 0.3rem 0.75rem; border-radius: 6px; border: none; cursor: pointer;
          font-size: 0.75rem; font-weight: 600; font-family: 'Inter',sans-serif;
          transition: background 0.12s, color 0.12s;
        }
        .db-period-tab.active { background: #fff; color: ${PRIMARY}; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .db-period-tab:not(.active) { background: none; color: #64748B; }

        /* ── Donut legend ── */
        .db-donut-legend { display: flex; flex-direction: column; gap: 0.625rem; }
        .db-legend-row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .db-legend-left { display: flex; align-items: center; gap: 8px; }
        .db-legend-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .db-legend-name { font-size: 0.8125rem; color: #475569; }
        .db-legend-val { font-size: 0.8125rem; font-weight: 600; color: #0F172A; }
        .db-legend-trend { font-size: 0.6875rem; font-weight: 600; }
        .db-legend-trend.up   { color: #059669; }
        .db-legend-trend.down { color: #E11D48; }
      `}</style>

      <div className="db-root">

        {/* ── Greeting row ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {greeting(user?.name)}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              Here's what's happening in the library today, {monthName} {today.getDate()}, {selectedYear}.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                className={`db-toggle${autoRefresh ? ' on' : ''}`}
                onClick={() => setAutoRefresh(v => !v)}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh (30s)'}
              />
              <span style={{ fontSize: '0.75rem', color: autoRefresh ? '#059669' : '#64748B', fontWeight: 500, transition: 'color 0.15s' }}>
                {autoRefresh ? 'Refreshing…' : 'Auto-refresh'}
              </span>
            </div>
            {/* Year switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0.3rem 0.5rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <button
                onClick={() => setSelectedYear(y => y - 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 4, color: '#64748B' }}
                title="Previous year"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>chevron_left</span>
              </button>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '0.9rem', color: '#64748B' }}>calendar_month</span>
                <span style={{ fontSize: '0.75rem', color: '#374151', fontWeight: 600, minWidth: 36, textAlign: 'center' }}>{selectedYear}</span>
              </span>
              <button
                onClick={() => setSelectedYear(y => Math.min(y + 1, new Date().getFullYear()))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px 4px', borderRadius: 4, color: '#64748B' }}
                title="Next year"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>chevron_right</span>
              </button>
            </div>
            <div className="db-period-tabs">
              {['week','month','year'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`db-period-tab${period === p ? ' active' : ''}`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button className="db-ghost-btn">
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>tune</span>
              Customize
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="db-kpi-grid">
          {STAT_CARDS.map(({ key, label, icon, color, bg, spark }) => (
            <div key={key} className="db-kpi">
              <div className="db-kpi-left">
                <div className="db-kpi-top">
                  <div className="db-kpi-icon-wrap" style={{ background: bg }}>
                    <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
                  </div>
                  <span className="db-kpi-label">{label}</span>
                </div>
                {isLoading
                  ? <div className="db-skeleton" style={{ height: 28, width: '55%', borderRadius: 6 }} />
                  : <div className="db-kpi-val">{fmt(stats[key])}</div>
                }
                <div className="db-kpi-sub">
                  <span className="db-kpi-trend up">↑ 12%</span>
                  <span className="db-kpi-vs">vs last month</span>
                </div>
              </div>
              <Sparkline data={sparkDataForKey(key)} color={color} />
            </div>
          ))}
        </div>

        {/* ── Charts row: bar chart + donut ── */}
        <div className="db-row-2-1">

          {/* Bar chart — Reading Activity by Category */}
          <div className="db-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="db-card-title">Reading Activity</span>
                  <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#CBD5E1', cursor: 'pointer' }}>info</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 3 }}>Books accessed per category</p>
              </div>
              <div className="db-period-tabs">
                {['week','month','year'].map(p => (
                  <button key={p} onClick={() => setPeriod(p)} className={`db-period-tab${period === p ? ' active' : ''}`}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(225,29,72,0.04)' }} />
                <Bar dataKey="count" fill="url(#bar-stripe)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donut — User Distribution */}
          <div className="db-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
              <span className="db-card-title">User Distribution</span>
              <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: '#CBD5E1', cursor: 'pointer' }}>info</span>
            </div>

            {donutTotal > 0 ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <PieChart width={180} height={180}>
                    <Pie
                      data={donutData} cx={90} cy={90}
                      innerRadius={55} outerRadius={80}
                      paddingAngle={3} dataKey="value"
                    >
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
                    </Pie>
                    <DonutLabel cx={90} cy={90} total={donutTotal} />
                  </PieChart>
                </div>
                <div className="db-donut-legend" style={{ marginTop: '0.75rem' }}>
                  {donutData.map((d, i) => (
                    <div key={d.name} className="db-legend-row">
                      <div className="db-legend-left">
                        <div className="db-legend-dot" style={{ background: DONUT_COLORS[i] }} />
                        <span className="db-legend-name">{d.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="db-legend-val">{fmt(d.value)}</span>
                        <span className="db-legend-trend up">+2.3%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <p style={{ fontSize: '0.8125rem', color: '#CBD5E1', textAlign: 'center' }}>No user data yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Daily readers area chart ── */}
        {readers.length > 0 && (
          <div className="db-card" style={{ padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <span className="db-card-title">Daily Active Readers</span>
                <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 3 }}>
                  {period === 'week' ? 'Past 7 days' : period === 'year' ? `Monthly — ${selectedYear}` : 'Past 30 days'} — unique reading sessions
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: PRIMARY, display: 'inline-block' }} />
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Sessions</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={filteredReaders} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ stroke: '#E2E8F0' }} />
                <Area type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} fill="url(#area-grad)" dot={false} activeDot={{ r: 4, fill: PRIMARY, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Books table + Push notification ── */}
        <div className="db-row-3-2">
          <RecentBooksTable />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <PushPanel />

            {/* Recent sign-ups */}
            <div className="db-card" style={{ padding: '1.125rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <span className="db-card-title">New Sign-ups</span>
                <Link to="/admin/users" className="db-ghost-btn" style={{ textDecoration: 'none' }}>View all</Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentUsers.length > 0 ? recentUsers.slice(0, 5).map(u => {
                  const ini = (u.name ?? '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: PRIMARY_LIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6875rem', fontWeight: 700, color: PRIMARY, flexShrink: 0, overflow: 'hidden' }}>
                        {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ini}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</div>
                      </div>
                      <span className="db-badge db-badge-gray" style={{ flexShrink: 0 }}>{u.role}</span>
                    </div>
                  );
                }) : <p style={{ color: '#CBD5E1', fontSize: '0.8125rem', textAlign: 'center', padding: '0.5rem 0' }}>No users yet.</p>}
              </div>

              <button
                onClick={() => sync()}
                disabled={syncing}
                className="db-ghost-btn"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.875rem' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>sync</span>
                {syncing ? 'Syncing…' : lastSync ? `Synced ${Math.round((Date.now() - lastSync) / 60000)}m ago` : 'Sync Podcast Feeds'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
