import { useState }                          from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api          from '../../services/api';
import toast        from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchUsers      = (params) => api.get('/admin/users',            { params }).then(r => r.data);
const fetchUserDetail = (id)     => api.get(`/admin/users/${id}`).then(r => r.data);
const toggleSuspend   = (id)     => api.patch(`/admin/users/${id}/suspend`).then(r => r.data);
const syncPatrons     = ()       => api.post('/admin/sync-patrons').then(r => r.data);

const FACULTIES = [
  '', 'Law', 'Medicine', 'Science', 'Technology', 'Computer Science',
  'Engineering', 'Petroleum Engineering', 'Civil Engineering',
  'Business', 'Economics', 'Education', 'Politics',
  'Mathematics', 'Philosophy', 'Literature', 'Social Sciences', 'Arts',
];

const FACULTY_BADGE_COLOR = {
  'Law':                   { bg: '#D9B96B', color: '#584400' },
  'Business':              { bg: '#EBD2CF', color: '#6B5456' },
  'Engineering':           { bg: '#ffdad9', color: '#8a1a27' },
  'Petroleum Engineering': { bg: '#ffdad9', color: '#8a1a27' },
  'Civil Engineering':     { bg: '#ffdad9', color: '#8a1a27' },
  'Science':               { bg: '#d9f2e6', color: '#1a6640' },
  'Medicine':              { bg: '#d9f2e6', color: '#1a6640' },
  'Technology':            { bg: '#dce8ff', color: '#1a3a8a' },
  'Computer Science':      { bg: '#dce8ff', color: '#1a3a8a' },
  'Politics':              { bg: '#f0d9ff', color: '#5a1a8a' },
  'Economics':             { bg: '#fff5d9', color: '#7a5000' },
};

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', padding: '1rem' }}>
      <div style={{ background: '#ffffff', borderRadius: '1rem', boxShadow: '0 24px 64px rgba(138,18,40,0.18)', width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #FCE8E6' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>Student Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5456', padding: 4, borderRadius: 6 }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#6B5456', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>Loading…</p>
          ) : !user ? (
            <p style={{ textAlign: 'center', color: '#6B5456', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>User not found.</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#ffd9dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.125rem', color: '#5C0F1F', flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>
                  {user.name?.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase() ?? '?'}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: '#1C0A0C', margin: 0, fontFamily: 'Inter, sans-serif' }}>{user.name}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#6B5456', margin: 0, fontFamily: 'Inter, sans-serif' }}>{user.email}</p>
                  <span style={{ fontSize: '0.6875rem', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, background: user.isActive ? '#B8964A' : '#ba1a1a', color: '#fff', display: 'inline-block', marginTop: 4 }}>
                    {user.isActive ? 'Active' : 'Suspended'}
                  </span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[['Faculty', user.faculty ?? '—'], ['Student ID', user.studentId ?? '—'], ['Koha Patron', user.kohaPatronId ?? '—'], ['Joined', new Date(user.createdAt).toLocaleDateString()]].map(([label, value]) => (
                  <div key={label} style={{ background: '#FCE8E6', borderRadius: '0.5rem', padding: '0.75rem' }}>
                    <p style={{ fontSize: '0.6875rem', color: '#6B5456', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>{label}</p>
                    <p style={{ fontWeight: 600, color: '#1C0A0C', margin: 0, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>{value}</p>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#8A1228', marginBottom: '0.75rem', fontFamily: 'Inter, sans-serif' }}>Reading History</h3>
              {progress.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>No reading activity yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {progress.slice(0, 8).map(p => (
                    <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {p.bookId?.coverUrl
                        ? <img src={p.bookId.coverUrl} alt={p.bookId.title} style={{ width: 32, height: 44, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 32, height: 44, borderRadius: 4, background: '#FCE8E6', flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1C0A0C', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>{p.bookId?.title ?? 'Unknown'}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <div style={{ flex: 1, background: '#ffd9dc', borderRadius: 9999, height: 4, maxWidth: 100 }}>
                            <div style={{ width: `${Math.min(100, p.progressPct ?? 0)}%`, background: '#5C0F1F', borderRadius: 9999, height: 4 }} />
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>{p.isCompleted ? 'Done' : `${Math.round(p.progressPct ?? 0)}%`}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
  const { user: authUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', { q, faculty, page }],
    queryFn:  () => fetchUsers({ q, faculty, page, limit: 50 }),
    staleTime: 30_000,
  });

  const { mutate: suspend, isPending: suspending } = useMutation({
    mutationFn: toggleSuspend,
    onSuccess: res => { toast.success(res.message); qc.invalidateQueries(['admin', 'users']); },
    onError: () => toast.error('Action failed.'),
  });

  const { mutate: syncP } = useMutation({
    mutationFn: syncPatrons,
    onSuccess: () => toast.success('Podcast feeds refreshed.'),
    onError:   () => toast.error('Refresh failed.'),
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <>
      <style>{`
        .aup-topbar { position: sticky; top: 0; width: 100%; z-index: 40; height: 80px; background: #FCE8E6; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; flex-shrink: 0; }
        .aup-stat-card { background: #ffffff; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 12px 40px rgba(74,8,16,0.04); display: flex; flex-direction: column; justify-content: space-between; }
        .aup-table-row:hover { background: rgba(255,240,240,0.3); }
        .aup-action-btn { opacity: 0; }
        .aup-table-row:hover .aup-action-btn { opacity: 1; }
        .aup-action-btn { transition: opacity 0.15s; }
      `}</style>

      {/* Topbar */}
      <header className="aup-topbar">
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>User Management</h2>
          <p style={{ color: '#6B5456', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', margin: 0 }}>Managing academic access and librarian roles</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B5456', fontSize: '1.25rem', pointerEvents: 'none' }}>search</span>
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search by name or ID..."
              style={{ background: '#ffffff', border: 'none', outline: 'none', boxShadow: '0 0 0 1px rgba(139,113,112,0.3)', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.75rem', fontSize: '0.875rem', width: 256, fontFamily: 'Inter, sans-serif' }}
              onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #5C0F1F')}
              onBlur={e  => (e.target.style.boxShadow = '0 0 0 1px rgba(139,113,112,0.3)')}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid rgba(223,191,190,0.3)', paddingLeft: '1.5rem' }}>
            <button
              onClick={() => syncP()}
              disabled={syncing}
              style={{ padding: '0.5rem', color: '#5C0F1F', background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%', display: 'flex' }}
              title="Sync Koha Patrons"
            >
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#5C0F1F', padding: '0.5rem', borderRadius: '50%' }}>
              <span className="material-symbols-outlined">notifications</span>
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#ba1a1a', borderRadius: '50%' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              {authUser?.avatar
                ? <img src={authUser.avatar} alt={authUser.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(107,15,26,0.2)' }} />
                : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8A1228', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(107,15,26,0.2)' }}>
                    <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem' }}>
                      {(authUser?.name ?? 'A').charAt(0).toUpperCase()}
                    </span>
                  </div>
              }
            </div>
          </div>
        </div>
      </header>

      <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="aup-stat-card">
            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B5456', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Total Students</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1rem' }}>
              <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#8A1228' }}>
                {isLoading ? '–' : total.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="aup-stat-card" style={{ borderBottom: '4px solid #5C0F1F' }}>
            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B5456', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Active Users</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1rem' }}>
              <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#8A1228' }}>
                {isLoading ? '–' : users.filter(u => u.isActive).length}
              </span>
              <span className="material-symbols-outlined" style={{ color: '#5C0F1F', fontSize: '1.5rem' }}>people</span>
            </div>
          </div>
          <div className="aup-stat-card">
            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B5456', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Students</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1rem' }}>
              <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#8A1228' }}>
                {isLoading ? '–' : users.filter(u => u.role === 'student').length}
              </span>
              <span className="material-symbols-outlined" style={{ color: '#B8964A', fontSize: '1.5rem' }}>school</span>
            </div>
          </div>
          <div className="aup-stat-card">
            <span style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B5456', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Staff / Admin</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '1rem' }}>
              <span style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#8A1228' }}>
                {isLoading ? '–' : users.filter(u => u.role !== 'student').length}
              </span>
              <span className="material-symbols-outlined" style={{ color: '#B8964A', fontSize: '1.5rem' }}>manage_accounts</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#ffffff', borderRadius: '1rem', boxShadow: '0 12px 40px rgba(74,8,16,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #FCE8E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>Student Registry</h3>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <select
                value={faculty}
                onChange={e => { setFaculty(e.target.value); setPage(1); }}
                style={{ border: '1px solid rgba(223,191,190,0.4)', borderRadius: '0.5rem', padding: '0.375rem 0.75rem', fontSize: '0.8125rem', color: '#1C0A0C', fontFamily: 'Inter, sans-serif', background: '#FCE8E6', outline: 'none' }}
              >
                {FACULTIES.map(f => <option key={f} value={f}>{f || 'All Faculties'}</option>)}
              </select>
              <button
                style={{ padding: '0.5rem 1rem', background: '#5C0F1F', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#8A1228')}
                onMouseLeave={e => (e.currentTarget.style.background = '#5C0F1F')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>person_add</span>
                Add New Student
              </button>
            </div>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#6B5456', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>Loading…</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,240,240,0.5)' }}>
                    {['Name', 'Student ID', 'Faculty', 'Joined Date', 'Last Active', 'Status', 'Actions'].map((col, i) => (
                      <th key={col} style={{
                        padding: i === 0 ? '1rem 2rem' : i === 6 ? '1rem 2rem' : '1rem 1.5rem',
                        fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.6875rem',
                        textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B5456',
                        textAlign: i === 6 ? 'right' : 'left',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>No users found.</td></tr>
                  ) : users.map(u => {
                    const initials = (u.name ?? '').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
                    const isActive = u.isActive ?? true;
                    return (
                      <tr key={u._id} className="aup-table-row" style={{ borderBottom: '1px solid #FCE8E6' }}>
                        {/* Name */}
                        <td style={{ padding: '1rem 2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', ...(isActive ? {} : { filter: 'grayscale(1)', opacity: 0.6 }) }}>
                            {u.avatar
                              ? <img src={u.avatar} alt={u.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffd9dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#5C0F1F', fontSize: '0.875rem', flexShrink: 0, fontFamily: 'Inter, sans-serif' }}>{initials}</div>
                            }
                            <div>
                              <p style={{ fontWeight: 600, color: '#1C0A0C', margin: 0, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>{u.name}</p>
                              <p style={{ fontSize: '0.6875rem', color: '#6B5456', margin: 0, fontFamily: 'Inter, sans-serif' }}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Student ID */}
                        <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 500, color: '#1C0A0C', ...(isActive ? {} : { opacity: 0.6 }) }}>
                          {u.studentId ?? '—'}
                        </td>
                        {/* Faculty */}
                        <td style={{ padding: '1rem 1.5rem', ...(isActive ? {} : { opacity: 0.6 }) }}>
                          {u.faculty ? (
                            <span style={{
                              padding: '2px 8px',
                              background: FACULTY_BADGE_COLOR[u.faculty]?.bg ?? '#ffdad9',
                              color: FACULTY_BADGE_COLOR[u.faculty]?.color ?? '#8a1a27',
                              borderRadius: '0.25rem',
                              fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase',
                              letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif',
                            }}>{u.faculty}</span>
                          ) : '—'}
                        </td>
                        {/* Joined */}
                        <td style={{ padding: '1rem 1.5rem', color: '#6B5456', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', ...(isActive ? {} : { opacity: 0.6 }) }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        {/* Last Active */}
                        <td style={{ padding: '1rem 1.5rem', color: '#6B5456', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', ...(isActive ? {} : { opacity: 0.6 }) }}>
                          {u.lastActive ?? '—'}
                        </td>
                        {/* Status */}
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#755b00' : '#ba1a1a', display: 'inline-block' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.75rem', color: isActive ? '#755b00' : '#ba1a1a', fontFamily: 'Inter, sans-serif' }}>
                              {isActive ? 'Active' : 'Suspended'}
                            </span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '1rem 2rem', textAlign: 'right' }}>
                          <div className="aup-action-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                              onClick={() => suspend(u._id)}
                              disabled={suspending}
                              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: isActive ? '#ba1a1a' : '#755b00' }}
                              onMouseEnter={e => (e.currentTarget.style.background = isActive ? '#ffdad6' : '#D9B96B')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              title={isActive ? 'Suspend Account' : 'Activate Account'}
                            >
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 0" : "'FILL' 1" }}>
                                {isActive ? 'person_off' : 'person_check'}
                              </span>
                            </button>
                            <button
                              onClick={() => setDetailUser(u._id)}
                              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: '#5C0F1F' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#ffd9dc')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                              title="View Profile"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div style={{ padding: '1rem 2rem', background: 'rgba(255,240,240,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,240,240,0.5)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>
              {total > 0 ? `Showing ${Math.min(50, total).toLocaleString()} of ${total.toLocaleString()} users` : 'Showing 1-10 of 12,842 users'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'none', color: '#6B5456', opacity: page === 1 ? 0.3 : 1 }}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', background: page === n ? '#5C0F1F' : 'none', color: page === n ? '#fff' : '#6B5456', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(pages || 3, p + 1))}
                style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer', background: 'none', color: '#6B5456' }}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '2rem', paddingBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms', 'Translate', 'Books API'].map(link => (
              <a key={link} href="#" style={{ color: 'rgba(138,18,40,0.4)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#5C0F1F')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(138,18,40,0.4)')}
              >{link}</a>
            ))}
          </div>
          <span style={{ color: 'rgba(138,18,40,0.5)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: 'Inter, sans-serif' }}>Powered by Google</span>
        </footer>
      </div>

      {detailUser && <UserDetailModal userId={detailUser} onClose={() => setDetailUser(null)} />}
    </>
  );
}
