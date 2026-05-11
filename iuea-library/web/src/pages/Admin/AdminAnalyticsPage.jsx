import { useQuery }            from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';
import api from '../../services/api';

const fetchAnalytics = () => api.get('/admin/analytics').then((r) => r.data);

const PRIMARY     = '#E11D48';
const PRIMARY_LIGHT = '#FFF1F4';

const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
);

const PIE_COLORS = ['#E11D48', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EA580C', '#0891B2', '#16A34A', '#64748B'];

// ── Heatmap helpers ───────────────────────────────────────────────────────────
function buildHeatmap(hourlyActivity) {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  (hourlyActivity ?? []).forEach(({ day, hour, count }) => {
    const d = Number(day);   // DOW from EXTRACT is 0=Sun … 6=Sat
    const h = Number(hour);
    if (d >= 0 && d <= 6 && h >= 0 && h <= 23) grid[d][h] = Number(count);
  });
  const max = Math.max(1, ...grid.flat());
  return { grid, max };
}

function heatColor(count, max) {
  if (count === 0) return '#F1F5F9';
  const pct = count / max;
  if (pct < 0.25) return 'rgba(225,29,72,0.15)';
  if (pct < 0.50) return 'rgba(225,29,72,0.35)';
  if (pct < 0.75) return 'rgba(225,29,72,0.60)';
  return PRIMARY;
}

// ── Shared tooltip ────────────────────────────────────────────────────────────
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0F172A', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.6 }}>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value?.toLocaleString()}</div>
    </div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, subtitle, action, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem 0.875rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFAFA' }}>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{title}</div>
          {subtitle && <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div style={{ padding: '1.25rem' }}>
        {children}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ w = '100%', h = 14, r = 6, mb = 0 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, marginBottom: mb,
      background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',
      backgroundSize: '200% 100%', animation: 'an-shimmer 1.4s ease-in-out infinite',
    }} />
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ icon = 'bar_chart', label = 'No data yet.' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 8 }}>
      <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#E2E8F0' }}>{icon}</span>
      <p style={{ fontSize: '0.8125rem', color: '#94A3B8', fontFamily: 'Inter, sans-serif', margin: 0 }}>{label}</p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn:  fetchAnalytics,
    staleTime: 60_000,
  });

  const dailyReads   = data?.dailyReads    ?? [];
  const topBooks     = data?.topBooks      ?? [];
  const langDist     = data?.langDist      ?? [];
  const hourlyAct    = data?.hourlyActivity ?? [];
  const dailySignups = data?.dailySignups  ?? [];

  const { grid, max } = buildHeatmap(hourlyAct);

  return (
    <>
      <style>{`
        @keyframes an-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
      `}</style>

      <div style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: 'Inter, sans-serif' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>Analytics</h1>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', margin: 0 }}>Platform usage insights — last 30 days</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'an-shimmer 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>Live data</span>
          </div>
        </div>

        {/* ── Row 1: Daily reads + Daily signups ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

          <Card title="Daily Read Sessions" subtitle="Unique reading sessions per day — last 30 days">
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skel h={200} r={8} />
              </div>
            ) : dailyReads.length === 0 ? <Empty icon="menu_book" label="No reading sessions recorded yet." /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyReads} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={PRIMARY} stopOpacity={0.12} />
                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ stroke: '#E2E8F0' }} />
                  <Area type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} fill="url(#ag1)" dot={false} activeDot={{ r: 4, fill: PRIMARY, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="New Registrations" subtitle="User sign-ups per day — last 30 days">
            {isLoading ? <Skel h={200} r={8} /> : dailySignups.length === 0 ? <Empty icon="person_add" label="No sign-ups recorded yet." /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailySignups} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} cursor={{ stroke: '#E2E8F0' }} />
                  <Area type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} fill="url(#ag2)" dot={false} activeDot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* ── Row 2: Top books horizontal bar ── */}
        <Card
          title="Top 10 Most-Read Books"
          subtitle="Ranked by reading session count"
          action={
            <span style={{ background: PRIMARY_LIGHT, color: PRIMARY, fontSize: '0.6875rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999 }}>
              {topBooks.length} books
            </span>
          }
        >
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4,5].map(i => <Skel key={i} h={22} r={4} />)}
            </div>
          ) : topBooks.length === 0 ? <Empty icon="auto_stories" label="No reading sessions recorded yet." /> : (
            <ResponsiveContainer width="100%" height={Math.max(200, topBooks.length * 28)}>
              <BarChart data={topBooks} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={PRIMARY} />
                    <stop offset="100%" stopColor="#FB7185" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="title" width={170} tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(t) => t.length > 24 ? t.slice(0, 24) + '…' : t} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(225,29,72,0.04)' }} />
                <Bar dataKey="sessions" fill="url(#barGrad)" radius={[0, 6, 6, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* ── Row 3: Language dist + Heatmap ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>

          <Card title="Language Distribution" subtitle="Books accessed by reading language">
            {isLoading ? <Skel h={220} r={8} /> : langDist.length === 0 ? <Empty icon="translate" label="No language data yet." /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={langDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                  >
                    {langDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11, color: '#64748B' }} formatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Reading Activity Heatmap" subtitle="Sessions by day and hour — last 7 days">
            {isLoading ? <Skel h={160} r={8} /> : hourlyAct.length === 0 ? <Empty icon="grid_view" label="No activity data yet." /> : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', marginBottom: 4, marginLeft: 28 }}>
                  {HOURS.map((h, i) => (
                    <div key={i} style={{ fontSize: 8, color: '#94A3B8', flex: 1, textAlign: 'center', minWidth: 14 }}>
                      {i % 4 === 0 ? h : ''}
                    </div>
                  ))}
                </div>
                {DAYS.map((day, di) => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 3 }}>
                    <span style={{ fontSize: 9, color: '#94A3B8', width: 24, flexShrink: 0, textAlign: 'right', paddingRight: 4 }}>{day}</span>
                    {grid[di].map((count, hi) => (
                      <div
                        key={hi}
                        title={`${day} ${HOURS[hi]}: ${count} sessions`}
                        style={{ flex: 1, height: 13, minWidth: 13, borderRadius: 3, background: heatColor(count, max), transition: 'background 0.1s', cursor: count > 0 ? 'default' : 'default' }}
                      />
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: '#94A3B8' }}>Less</span>
                  {['#F1F5F9', 'rgba(225,29,72,0.15)', 'rgba(225,29,72,0.35)', 'rgba(225,29,72,0.60)', PRIMARY].map((c, i) => (
                    <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.04)' }} />
                  ))}
                  <span style={{ fontSize: 9, color: '#94A3B8' }}>More</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
