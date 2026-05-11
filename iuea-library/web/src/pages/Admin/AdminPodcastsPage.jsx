import { useState }                              from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api   from '../../services/api';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const CATEGORIES = ['Education', 'Technology', 'Science', 'Business', 'Arts', 'Health', 'Society', 'Sports', 'Other'];

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchPodcasts  = (params)       => api.get('/admin/podcasts',         { params }).then(r => r.data);
const createPodcast  = (data)         => api.post('/admin/podcasts',        data).then(r => r.data);
const editPodcast    = ({ id, data }) => api.patch(`/admin/podcasts/${id}`, data).then(r => r.data);
const archivePodcast = (id)           => api.delete(`/admin/podcasts/${id}`).then(r => r.data);
const syncFeeds      = ()             => api.post('/admin/sync-podcasts').then(r => r.data);

// ── Add Podcast slide-in panel ────────────────────────────────────────────────
function AddPodcastPanel({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ rssUrl: '', category: 'Education', language: 'English' });

  const { mutate, isPending } = useMutation({
    mutationFn: createPodcast,
    onSuccess: () => { toast.success('Podcast added.'); qc.invalidateQueries(['admin', 'podcasts']); onClose(); },
    onError: e => toast.error(e?.response?.data?.message ?? 'Failed to add podcast.'),
  });

  const inputStyle = { width: '100%', border: '1px solid #EBD2CF', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ width: '100%', maxWidth: 420, background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-4px 0 40px rgba(225,29,72,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #FCE8E6' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#E11D48', margin: 0 }}>Add Podcast</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5456' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>RSS Feed URL *</label>
            <input
              placeholder="https://feeds.example.com/podcast.rss"
              value={form.rssUrl}
              onChange={e => setForm(p => ({ ...p, rssUrl: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Language</label>
            <input
              placeholder="English"
              value={form.language}
              onChange={e => setForm(p => ({ ...p, language: e.target.value }))}
              style={inputStyle}
            />
          </div>

          <div style={{ background: '#FDF4F2', border: '1px solid #EBD2CF', borderRadius: '0.5rem', padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: '#E11D48', flexShrink: 0, marginTop: 1 }}>info</span>
            <p style={{ fontSize: '0.75rem', color: '#6B5456', margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: '1.5' }}>
              The server will fetch the RSS feed and import podcast details and episodes automatically.
            </p>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #FCE8E6' }}>
          <button
            onClick={() => mutate(form)}
            disabled={isPending || !form.rssUrl.trim()}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', background: '#E11D48', color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: (isPending || !form.rssUrl.trim()) ? 0.5 : 1 }}>
            {isPending ? 'Importing…' : 'Add Podcast'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditPodcastModal({ podcast, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title:       podcast.title       ?? '',
    description: podcast.description ?? '',
    category:    podcast.category    ?? 'Education',
    language:    podcast.language    ?? 'English',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: editPodcast,
    onSuccess: () => { toast.success('Podcast updated.'); qc.invalidateQueries(['admin', 'podcasts']); onClose(); },
    onError: () => toast.error('Update failed.'),
  });

  const inputStyle = { width: '100%', border: '1px solid #EBD2CF', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: '#ffffff', borderRadius: '1rem', boxShadow: '0 24px 64px rgba(138,18,40,0.18)', width: '100%', maxWidth: 400, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#E11D48', margin: 0 }}>Edit Podcast</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5456' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Title</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Description</label>
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'none' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Language</label>
            <input value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value }))} style={inputStyle} />
          </div>
        </div>

        <button
          onClick={() => mutate({ id: podcast.id, data: form })}
          disabled={isPending}
          style={{ padding: '0.625rem', borderRadius: '0.5rem', background: '#E11D48', color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: isPending ? 0.5 : 1 }}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminPodcastsPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [q,       setQ]       = useState('');
  const [page,    setPage]    = useState(1);
  const [panel,   setPanel]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey:  ['admin', 'podcasts', { q, page }],
    queryFn:   () => fetchPodcasts({ q, page, limit: 30 }),
    staleTime: 30_000,
  });

  const { mutate: archive } = useMutation({
    mutationFn: archivePodcast,
    onSuccess: () => { toast.success('Podcast archived.'); qc.invalidateQueries(['admin', 'podcasts']); },
    onError:   () => toast.error('Archive failed.'),
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFeeds();
      toast.success('Feeds refreshed.');
      qc.invalidateQueries(['admin', 'podcasts']);
    } catch {
      toast.error('Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  const podcasts = data?.podcasts ?? [];
  const total    = data?.total    ?? 0;
  const pages    = data?.pages    ?? 1;

  return (
    <>
      <style>{`
        .app-table-row:hover td { background: #FAFAFE; }
        .app-action-btn { opacity: 0; transition: opacity 0.15s; }
        .app-table-row:hover .app-action-btn { opacity: 1; }
      `}</style>

      {/* Topbar */}
      <header style={{ position: 'sticky', top: 0, width: '100%', zIndex: 40, height: 64, background: '#fff', borderBottom: '1px solid #E9EAEC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9375rem', fontWeight: 600, color: '#111', margin: 0, letterSpacing: '-0.01em' }}>Podcast Management</h2>
          <span style={{ fontSize: '0.6875rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9CA3AF', fontFamily: 'Inter, sans-serif' }}>RSS Feed Control</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: '0.875rem', pointerEvents: 'none' }}>search</span>
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search podcasts…"
              style={{ background: '#F4F5F7', border: 'none', outline: 'none', borderRadius: 8, padding: '0.4rem 0.875rem 0.4rem 2rem', fontSize: '0.8125rem', width: 240, fontFamily: 'Inter, sans-serif', transition: 'box-shadow 0.15s, background 0.15s' }}
              onFocus={e => { e.target.style.boxShadow = '0 0 0 2px rgba(225,29,72,0.15)'; e.target.style.background = '#fff'; }}
              onBlur={e  => { e.target.style.boxShadow = 'none'; e.target.style.background = '#F4F5F7'; }}
            />
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            style={{ background: '#fff', color: '#475569', padding: '0.375rem 0.875rem', borderRadius: 8, border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'Inter, sans-serif', opacity: syncing ? 0.6 : 1, transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>sync</span>
            {syncing ? 'Syncing…' : 'Sync Feeds'}
          </button>
          <button
            onClick={() => setPanel(true)}
            style={{ background: '#E11D48', color: '#fff', padding: '0.375rem 0.875rem', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(225,29,72,0.2)', transition: 'background 0.12s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#be1239')}
            onMouseLeave={e => (e.currentTarget.style.background = '#E11D48')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>add</span>
            Add Podcast
          </button>
        </div>
      </header>

      <section style={{ padding: '1.75rem 1.75rem 6rem' }}>

        {/* Stats bento */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
          <div style={{ gridColumn: 'span 3', background: '#fff', padding: '1.25rem', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#64748B', margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>Total Podcasts</p>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {isLoading ? '—' : total.toLocaleString()}
                </h3>
              </div>
              <div style={{ padding: '0.625rem', background: '#FFF1F4', borderRadius: 8, color: '#E11D48' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', fontVariationSettings: "'FILL' 1" }}>podcasts</span>
              </div>
            </div>
          </div>
          <div style={{ gridColumn: 'span 3', background: '#fff', padding: '1.25rem', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#64748B', margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>Active</p>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {isLoading ? '—' : podcasts.filter(p => p.isActive).length}
                </h3>
              </div>
              <div style={{ padding: '0.625rem', background: '#ECFDF5', borderRadius: 8, color: '#10B981' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
            </div>
          </div>
          <div style={{ gridColumn: 'span 6', background: '#E11D48', padding: '1.25rem', borderRadius: 12, boxShadow: '0 8px 24px rgba(225,29,72,0.2)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #E11D48 0%, #120508 100%)', opacity: 0.9 }} />
            <div style={{ position: 'relative', zIndex: 1, color: '#fff' }}>
              <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.125rem', fontStyle: 'italic', margin: '0 0 0.25rem' }}>Add podcasts via RSS feed URL.</h4>
              <p style={{ color: 'rgba(255,209,212,0.8)', fontSize: '0.8125rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Episodes are imported automatically. Use "Sync Feeds" to refresh episode lists.
              </p>
            </div>
            <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.08 }}>
              <span className="material-symbols-outlined" style={{ fontSize: '8rem', color: '#fff' }}>podcasts</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '0.875rem', color: '#0F172A', margin: 0 }}>All Podcasts</h3>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#6B5456', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>Loading…</p>
          ) : podcasts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#EBD2CF', display: 'block', marginBottom: '1rem' }}>podcasts</span>
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.125rem', color: '#6B5456', marginBottom: '0.5rem' }}>No podcasts yet.</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#A89597' }}>
                Click "Add Podcast" and paste an RSS feed URL to get started.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#FAFAFA' }}>
                    {['Cover', 'Podcast', 'Category', 'Episodes', 'Subscribers', 'Status', 'Actions'].map((col, i) => (
                      <th key={col} style={{ padding: '0.625rem 1.25rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94A3B8', width: i === 0 ? 80 : undefined, textAlign: i === 6 ? 'right' : 'left', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {podcasts.map(p => {
                    const episodeCount = Array.isArray(p.episodes) ? p.episodes.length : (typeof p.episodes === 'string' ? JSON.parse(p.episodes ?? '[]').length : 0);
                    return (
                      <tr key={p.id} className="app-table-row" style={{ borderBottom: '1px solid #F8FAFC' }}>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', background: '#F1F5F9', flexShrink: 0 }}>
                            {p.coverUrl
                              ? <img src={p.coverUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span className="material-symbols-outlined" style={{ color: '#94A3B8', fontSize: '1.125rem' }}>podcasts</span>
                                </div>
                            }
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', maxWidth: 260 }}>
                          <span style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Inter, sans-serif' }}>{p.title}</span>
                          {p.hostName && <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>{p.hostName}</span>}
                          {p.rssUrl && <span style={{ display: 'block', fontSize: '0.6875rem', color: '#94A3B8', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{p.rssUrl}</span>}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          {p.category
                            ? <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#E11D48', background: '#FFF1F4', padding: '2px 9px', borderRadius: 999, fontFamily: 'Inter, sans-serif' }}>{p.category}</span>
                            : <span style={{ color: '#94A3B8', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>—</span>
                          }
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{episodeCount}</td>
                        <td style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: '#0F172A', fontFamily: 'Inter, sans-serif' }}>{(p.subscriberCount ?? 0).toLocaleString()}</td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Inter, sans-serif', fontSize: '0.8125rem', color: '#475569' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: p.isActive ? '#10B981' : '#94A3B8', flexShrink: 0 }} />
                            {p.isActive ? 'Active' : 'Archived'}
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                          <div className="app-action-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            <button
                              onClick={() => setEditing(p)}
                              style={{ padding: '0.375rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none', color: '#64748B', transition: 'background 0.12s, color 0.12s' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#E11D48'; e.currentTarget.style.background = '#FFF1F4'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'none'; }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>edit_note</span>
                            </button>
                            <button
                              onClick={() => { if (window.confirm(`Archive "${p.title}"?`)) archive(p.id); }}
                              style={{ padding: '0.375rem', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none', color: '#64748B', transition: 'background 0.12s, color 0.12s' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#991B1B'; e.currentTarget.style.background = '#FEE2E2'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'none'; }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.125rem' }}>delete</span>
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
          {pages > 1 && (
            <div style={{ padding: '1rem 1.5rem', background: '#FAFAFA', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'Inter, sans-serif' }}>
                Page {page} of {pages} · {total.toLocaleString()} total
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '0.8125rem', opacity: page === 1 ? 0.4 : 1, fontFamily: 'Inter, sans-serif' }}>
                  ← Prev
                </button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                  style={{ padding: '0.375rem 0.75rem', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: page >= pages ? 'not-allowed' : 'pointer', color: '#475569', fontSize: '0.8125rem', opacity: page >= pages ? 0.4 : 1, fontFamily: 'Inter, sans-serif' }}>
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {panel   && <AddPodcastPanel onClose={() => setPanel(false)} />}
      {editing && <EditPodcastModal podcast={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
