import { useQuery, useMutation } from '@tanstack/react-query';
import { Users, BookOpen, MessageCircle, Mic2, RefreshCw } from 'lucide-react';
import api   from '../../services/api';
import toast from 'react-hot-toast';

const fetchStats = () => api.get('/admin/stats').then((r) => r.data);
const syncKoha   = ()   => api.post('/admin/books/sync', { q: '', limit: 100 }).then((r) => r.data);

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: fetchStats });
  const { mutate: sync, isPending: syncing } = useMutation({
    mutationFn: syncKoha,
    onSuccess:  (res) => toast.success(res.message),
    onError:    ()    => toast.error('Sync failed.'),
  });

  const cards = [
    { label: 'Total Users',    value: data?.stats?.users,    icon: Users,          color: 'bg-blue-50   text-blue-600'   },
    { label: 'Books',          value: data?.stats?.books,    icon: BookOpen,       color: 'bg-primary/10 text-primary'   },
    { label: 'Chat Sessions',  value: data?.stats?.sessions, icon: MessageCircle,  color: 'bg-green-50  text-green-600'  },
    { label: 'Podcasts',       value: data?.stats?.podcasts, icon: Mic2,           color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-xl font-semibold text-gray-800">Overview</h2>
        <button
          onClick={() => sync()}
          disabled={syncing}
          className="flex items-center gap-2 text-sm bg-primary text-white px-4 py-2 rounded-btn hover:bg-primary-dark disabled:opacity-50"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          Sync Koha
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-card shadow-card p-5">
            <div className={`inline-flex p-2 rounded-full mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{isLoading ? '–' : (value ?? 0)}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Recent Users</h3>
        {isLoading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b">
                <th className="pb-2">Name</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentUsers?.map((u) => (
                <tr key={u._id} className="border-b last:border-0">
                  <td className="py-2 font-medium">{u.name}</td>
                  <td className="py-2 text-gray-500">{u.email}</td>
                  <td className="py-2 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
