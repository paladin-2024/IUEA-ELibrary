import { useState }                        from 'react';
import { useQuery, useMutation }           from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FiUsers, FiBookOpen, FiMessageSquare, FiRefreshCw, FiLoader,
} from 'react-icons/fi';
import { BsMicFill } from 'react-icons/bs';
import api            from '../../services/api';
import toast          from 'react-hot-toast';

const fetchStats = () => api.get('/admin/stats').then((r) => r.data);
const runSync    = () => api.post('/admin/sync-koha', { q: '', limit: 500 }).then((r) => r.data);

const CARDS = [
  { key: 'users',    label: 'Total Users',   icon: FiUsers,        bg: 'bg-blue-50',    text: 'text-blue-600'  },
  { key: 'books',    label: 'Books',         icon: FiBookOpen,     bg: 'bg-primary/8',  text: 'text-primary'   },
  { key: 'sessions', label: 'Chat Sessions', icon: FiMessageSquare,bg: 'bg-green-50',   text: 'text-green-600' },
  { key: 'podcasts', label: 'Podcasts',      icon: BsMicFill,      bg: 'bg-purple-50',  text: 'text-purple-600'},
];

const FACULTY_COLORS = {
  Law: '#7B0D1E', Medicine: '#C9A84C', Engineering: '#2563EB',
  Business: '#16A34A', IT: '#9333EA', Education: '#EA580C',
  Arts: '#DB2777', Science: '#0891B2',
};

export default function AdminDashboard() {
  const [lastSync, setLastSync] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn:  fetchStats,
    staleTime: 30_000,
  });

  const { mutate: sync, isPending: syncing } = useMutation({
    mutationFn: runSync,
    onSuccess: (res) => {
      toast.success(res.message);
      setLastSync(new Date());
      refetch();
    },
    onError: () => toast.error('Koha sync failed.'),
  });

  const stats       = data?.stats        ?? {};
  const readers     = data?.dailyReaders ?? [];
  const recentUsers = data?.recentUsers  ?? [];

  // Faculty breakdown from recent users
  const facultyCounts = recentUsers.reduce((acc, u) => {
    if (u.faculty) acc[u.faculty] = (acc[u.faculty] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Overview</h1>
        <p className="text-xs text-gray-400">
          {lastSync ? `Last synced ${Math.round((Date.now() - lastSync) / 60000)} min ago` : 'Not synced yet'}
        </p>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(({ key, label, icon: Icon, bg, text }) => (
          <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${bg}`}>
              <Icon size={18} className={text} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {isLoading ? '–' : (stats[key] ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Daily active readers chart ──────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Daily Active Readers — last 30 days
          </h2>
          {readers.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-400">
              No reading data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={readers} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(v) => [v, 'Readers']}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#7B0D1E"
                  strokeWidth={2}
                  dot={{ fill: '#C9A84C', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#C9A84C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Koha sync card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Koha Catalogue Sync</h2>
          <p className="text-xs text-gray-400 mb-4">
            Pulls bibliographic records from Koha and upserts them into MongoDB.
          </p>

          <div className="flex-1 flex flex-col justify-center gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {isLoading ? '–' : (stats.books ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">books in catalogue</p>
            </div>

            {Object.keys(facultyCounts).length > 0 && (
              <div className="space-y-1.5">
                {Object.entries(facultyCounts).slice(0, 5).map(([fac, cnt]) => (
                  <div key={fac} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: FACULTY_COLORS[fac] ?? '#6b7280' }}
                    />
                    <span className="text-xs text-gray-600 flex-1">{fac}</span>
                    <span className="text-xs font-semibold text-gray-700">{cnt}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => sync()}
            disabled={syncing}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-60 transition-colors"
          >
            {syncing
              ? <><FiLoader size={14} className="animate-spin" /> Syncing…</>
              : <><FiRefreshCw size={14} /> Sync Now</>
            }
          </button>
        </div>
      </div>

      {/* ── Recent users table ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Registrations</h2>
        {isLoading ? (
          <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Faculty</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Joined</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-900">{u.name}</td>
                    <td className="py-2.5 text-gray-500">{u.email}</td>
                    <td className="py-2.5 text-gray-500">{u.faculty ?? '—'}</td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        u.role === 'admin' ? 'bg-primary/10 text-primary'
                          : u.role === 'staff' ? 'bg-blue-50 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        u.isActive
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
