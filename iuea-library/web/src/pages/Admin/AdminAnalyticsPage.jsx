import { useQuery }            from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import api from '../../services/api';

const fetchAnalytics = () => api.get('/admin/analytics').then((r) => r.data);

const DAYS  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12a' : i < 12 ? `${i}a` : i === 12 ? '12p' : `${i - 12}p`
);

const PIE_COLORS = [
  '#5C0F1F', '#B8964A', '#2563EB', '#16A34A',
  '#9333EA', '#EA580C', '#DB2777', '#0891B2', '#6b7280',
];

const tooltipStyle = {
  fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb',
};

// ── Heatmap helpers ───────────────────────────────────────────────────────────
function buildHeatmap(hourlyActivity) {
  // Grid: [day 0..6][hour 0..23]
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  (hourlyActivity ?? []).forEach(({ day, hour, count }) => {
    grid[day - 1][hour] = count;   // day: 1=Sun…7=Sat → 0-indexed
  });
  const max = Math.max(1, ...grid.flat());
  return { grid, max };
}

function heatColor(count, max) {
  if (count === 0) return 'bg-gray-100';
  const pct = count / max;
  if (pct < 0.25) return 'bg-primary/20';
  if (pct < 0.50) return 'bg-primary/40';
  if (pct < 0.75) return 'bg-primary/65';
  return 'bg-primary';
}

// ── Sections ──────────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn:  fetchAnalytics,
    staleTime: 60_000,
  });

  const dailyReads    = data?.dailyReads    ?? [];
  const topBooks      = data?.topBooks      ?? [];
  const langDist      = data?.langDist      ?? [];
  const hourlyAct     = data?.hourlyActivity ?? [];
  const dailySignups  = data?.dailySignups  ?? [];

  const { grid, max } = buildHeatmap(hourlyAct);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Row 1: Daily reads + Daily signups */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Daily Read Sessions — last 30 days">
          {dailyReads.length === 0 ? (
            <p className="text-sm text-gray-400 h-40 flex items-center justify-center">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyReads} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Sessions']} />
                <Line
                  type="monotone" dataKey="count" stroke="#5C0F1F" strokeWidth={2}
                  dot={{ fill: '#B8964A', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#B8964A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="New Registrations — last 30 days">
          {dailySignups.length === 0 ? (
            <p className="text-sm text-gray-400 h-40 flex items-center justify-center">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailySignups} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, 'Sign-ups']} />
                <Line
                  type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2}
                  dot={{ fill: '#2563EB', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#2563EB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      {/* Row 2: Top books bar chart */}
      <Section title="Top 10 Most-Read Books">
        {topBooks.length === 0 ? (
          <p className="text-sm text-gray-400 h-40 flex items-center justify-center">No data.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={topBooks}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="title"
                width={160}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickFormatter={(t) => t.length > 22 ? t.slice(0, 22) + '…' : t}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => [v, 'Sessions']}
                labelFormatter={(l) => l}
              />
              <Bar dataKey="sessions" fill="#5C0F1F" radius={[0, 4, 4, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Section>

      {/* Row 3: Language dist + Activity heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Section title="Language Distribution">
          {langDist.length === 0 ? (
            <p className="text-sm text-gray-400 h-48 flex items-center justify-center">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={langDist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                  }
                  labelLine={false}
                >
                  {langDist.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => [v, name]}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => value.length > 14 ? value.slice(0, 14) + '…' : value}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Reading Activity Heatmap — last 7 days">
          {hourlyAct.length === 0 ? (
            <p className="text-sm text-gray-400 h-48 flex items-center justify-center">No data.</p>
          ) : (
            <div className="overflow-x-auto">
              {/* Hour labels */}
              <div className="flex mb-1 ml-8">
                {HOURS.map((h, i) => (
                  <div
                    key={i}
                    className="text-[8px] text-gray-400 flex-1 text-center"
                    style={{ minWidth: 14 }}
                  >
                    {i % 3 === 0 ? h : ''}
                  </div>
                ))}
              </div>
              {/* Grid rows */}
              {DAYS.map((day, di) => (
                <div key={day} className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] text-gray-400 w-7 flex-shrink-0 text-right pr-1">
                    {day}
                  </span>
                  {grid[di].map((count, hi) => (
                    <div
                      key={hi}
                      title={`${day} ${HOURS[hi]}: ${count} sessions`}
                      className={`flex-1 rounded-sm transition-colors ${heatColor(count, max)}`}
                      style={{ minWidth: 14, height: 14 }}
                    />
                  ))}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-3 justify-end">
                <span className="text-[9px] text-gray-400">Less</span>
                {['bg-gray-100', 'bg-primary/20', 'bg-primary/40', 'bg-primary/65', 'bg-primary'].map((c) => (
                  <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
                <span className="text-[9px] text-gray-400">More</span>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
