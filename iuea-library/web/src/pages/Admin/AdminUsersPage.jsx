import { useState }                          from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiSearch, FiEye, FiUserX, FiUserCheck, FiLink, FiX, FiLoader, FiChevronLeft, FiChevronRight,
} from 'react-icons/fi';
import api   from '../../services/api';
import toast from 'react-hot-toast';

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchUsers      = (params)  => api.get('/admin/users',           { params }).then((r) => r.data);
const fetchUserDetail = (id)      => api.get(`/admin/users/${id}`).then((r) => r.data);
const toggleSuspend   = (id)      => api.patch(`/admin/users/${id}/suspend`).then((r) => r.data);
const syncPatrons     = ()        => api.post('/admin/sync-patrons').then((r) => r.data);

const FACULTIES = [
  '', 'Law', 'Medicine', 'Engineering', 'Business', 'IT', 'Education', 'Arts', 'Science',
];

// ── User detail modal ─────────────────────────────────────────────────────────
function UserDetailModal({ userId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn:  () => fetchUserDetail(userId),
    enabled:  !!userId,
  });

  const user     = data?.user;
  const progress = data?.progress ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">User Detail</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : !user ? (
            <p className="text-sm text-gray-400 text-center py-8">User not found.</p>
          ) : (
            <>
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-primary">
                    {user.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      user.role === 'admin' ? 'bg-primary/10 text-primary'
                        : user.role === 'staff' ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      user.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Faculty',     user.faculty     ?? '—'],
                  ['Student ID',  user.studentId   ?? '—'],
                  ['Koha Patron', user.kohaPatronId ?? '—'],
                  ['Joined',      new Date(user.createdAt).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="font-medium text-gray-800">{value}</p>
                  </div>
                ))}
              </div>

              {/* Reading history */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Reading History</h3>
                {progress.length === 0 ? (
                  <p className="text-sm text-gray-400">No reading activity yet.</p>
                ) : (
                  <div className="space-y-2">
                    {progress.slice(0, 8).map((p) => (
                      <div key={p._id} className="flex items-center gap-3">
                        {p.bookId?.coverUrl
                          ? <img src={p.bookId.coverUrl} alt={p.bookId.title}
                              className="w-8 h-11 rounded object-cover flex-shrink-0 shadow-sm" />
                          : <div className="w-8 h-11 rounded bg-gray-100 flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {p.bookId?.title ?? 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                              <div
                                className="bg-primary h-1.5 rounded-full"
                                style={{ width: `${Math.min(100, (p.progressPct ?? 0))}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">
                              {p.isCompleted ? 'Done' : `${Math.round(p.progressPct ?? 0)}%`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [q,          setQ]          = useState('');
  const [faculty,    setFaculty]    = useState('');
  const [page,       setPage]       = useState(1);
  const [detailUser, setDetailUser] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { q, faculty, page }],
    queryFn:  () => fetchUsers({ q, faculty, page, limit: 50 }),
    staleTime: 30_000,
  });

  const { mutate: suspend, isPending: suspending } = useMutation({
    mutationFn: toggleSuspend,
    onSuccess: (res) => {
      toast.success(res.message);
      qc.invalidateQueries(['admin', 'users']);
    },
    onError: () => toast.error('Action failed.'),
  });

  const { mutate: syncP, isPending: syncing } = useMutation({
    mutationFn: syncPatrons,
    onSuccess: (res) => toast.success(res.message),
    onError: ()      => toast.error('Patron sync failed.'),
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => syncP()}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {syncing
            ? <><FiLoader size={14} className="animate-spin" /> Syncing…</>
            : <><FiLink size={14} /> Link Missing Patrons</>
          }
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={faculty}
          onChange={(e) => { setFaculty(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {FACULTIES.map((f) => (
            <option key={f} value={f}>{f || 'All Faculties'}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-8 text-center">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Student ID</th>
                  <th className="px-4 py-3 font-medium">Faculty</th>
                  <th className="px-4 py-3 font-medium">Koha Patron</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                      No users found.
                    </td>
                  </tr>
                ) : users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {u.name?.[0]?.toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[140px]">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {u.studentId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.faculty ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {u.kohaPatronId
                        ? <span className="text-green-600 font-semibold">{u.kohaPatronId}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        u.role === 'admin' ? 'bg-primary/10 text-primary'
                          : u.role === 'staff' ? 'bg-blue-50 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                      }`}>
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetailUser(u._id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="View detail"
                        >
                          <FiEye size={14} />
                        </button>
                        <button
                          onClick={() => suspend(u._id)}
                          disabled={suspending}
                          className={`p-1.5 rounded-lg transition-colors ${
                            u.isActive
                              ? 'hover:bg-red-50 text-gray-500 hover:text-red-500'
                              : 'hover:bg-green-50 text-gray-500 hover:text-green-600'
                          }`}
                          title={u.isActive ? 'Suspend user' : 'Reactivate user'}
                        >
                          {u.isActive ? <FiUserX size={14} /> : <FiUserCheck size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{total.toLocaleString()} users</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <FiChevronLeft size={16} />
              </button>
              <span>{page} / {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailUser && (
        <UserDetailModal userId={detailUser} onClose={() => setDetailUser(null)} />
      )}
    </div>
  );
}
