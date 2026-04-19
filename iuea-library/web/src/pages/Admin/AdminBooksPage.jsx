import { useState }                                    from 'react';
import { useQuery, useMutation, useQueryClient }       from '@tanstack/react-query';
import api        from '../../services/api';
import toast      from 'react-hot-toast';
import useAuthStore from '../../store/authStore';

const BOOK_CATEGORIES = [
  'General', 'Law', 'Science', 'Technology', 'Computer Science',
  'Business', 'Engineering', 'Petroleum Engineering', 'Civil Engineering',
  'Politics', 'Medicine', 'Education', 'Economics', 'Mathematics',
  'Philosophy', 'Literature', 'Social Sciences', 'Arts', 'History',
];

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchBooks    = (params)       => api.get('/admin/books',         { params }).then(r => r.data);
const deleteBook    = (id)           => api.delete(`/admin/books/${id}`).then(r => r.data);
const updateBook    = ({ id, data }) => api.patch(`/admin/books/${id}`, data).then(r => r.data);
const uploadBook    = (formData)     => api.post('/admin/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);
const discoverBooks = (params)       => api.get('/admin/books/discover', { params }).then(r => r.data);
const importBook    = (data)         => api.post('/admin/books/import',  data).then(r => r.data);

// ── Add Book Panel ────────────────────────────────────────────────────────────
function AddBookPanel({ onClose }) {
  const qc   = useQueryClient();
  const [tab, setTab]   = useState('upload');
  const [form, setForm] = useState({ title: '', author: '', description: '', category: 'General', faculty: '', tags: '', languages: 'English', publishedYear: '', archiveId: '' });
  const [bookFile,  setBookFile]   = useState(null);
  const [coverFile, setCoverFile]  = useState(null);
  const [dragging,  setDragging]   = useState(false);
  const [discoverQ, setDiscoverQ]  = useState('');
  const [discoverSrc, setDiscoverSrc] = useState('gutenberg');
  const [discovered, setDiscovered]   = useState([]);
  const [discovering, setDiscovering] = useState(false);

  const bookRef  = { current: null };
  const coverRef = { current: null };

  const { mutate: submit, isPending } = useMutation({
    mutationFn: uploadBook,
    onSuccess: () => { toast.success('Book added.'); qc.invalidateQueries(['admin', 'books']); onClose(); },
    onError: e => toast.error(e?.response?.data?.message ?? 'Upload failed.'),
  });

  const { mutate: importMutate, isPending: importing } = useMutation({
    mutationFn: importBook,
    onSuccess: () => { toast.success('Book imported.'); qc.invalidateQueries(['admin', 'books']); },
    onError:  () => toast.error('Import failed.'),
  });

  const handleDrop = e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setBookFile(f); };

  const handleSubmit = e => {
    e?.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (bookFile)  fd.append('bookFile',  bookFile);
    if (coverFile) fd.append('coverFile', coverFile);
    submit(fd);
  };

  const handleDiscover = async () => {
    if (!discoverQ.trim()) return;
    setDiscovering(true);
    try {
      const res = await discoverBooks({ q: discoverQ, source: discoverSrc });
      setDiscovered(res.books ?? []);
    } catch { toast.error('Discovery failed.'); }
    setDiscovering(false);
  };

  const inputStyle = { width: '100%', border: '1px solid #EBD2CF', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ width: '100%', maxWidth: 480, background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-4px 0 40px rgba(138,18,40,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #FCE8E6' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>Add Book</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5456' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #FCE8E6', padding: '0 1.5rem', gap: '0.25rem', overflowX: 'auto' }}>
          {[
            ['upload',   'Upload File',     'upload'],
            ['discover', 'Discover API',    'travel_explore'],
            ['archive',  'From Archive ID', 'inventory_2'],
          ].map(([k, label, icon]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'none', borderBottom: `2px solid ${tab === k ? '#8A1228' : 'transparent'}`, color: tab === k ? '#8A1228' : '#6B5456', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* ── Upload tab ── */}
          {tab === 'upload' && (
            <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input placeholder="Title *" value={form.title}   onChange={e => setForm(p => ({ ...p, title: e.target.value }))}  style={inputStyle} required />
              <input placeholder="Author *" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={inputStyle} required />
              <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                  {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Year" type="number" value={form.publishedYear} onChange={e => setForm(p => ({ ...p, publishedYear: e.target.value }))} style={inputStyle} />
              </div>
              <input placeholder="Faculty (comma-separated)" value={form.faculty}    onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))}    style={inputStyle} />
              <input placeholder="Languages (comma-separated)" value={form.languages} onChange={e => setForm(p => ({ ...p, languages: e.target.value }))} style={inputStyle} />
              <input placeholder="Tags (comma-separated)" value={form.tags}          onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}        style={inputStyle} />

              {/* File drop */}
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('bookFileInput')?.click()}
                style={{ border: `2px dashed ${dragging ? '#8A1228' : '#EBD2CF'}`, borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(138,18,40,0.04)' : 'transparent' }}
              >
                <span className="material-symbols-outlined" style={{ color: '#6B5456', display: 'block', marginBottom: '0.5rem' }}>upload</span>
                <p style={{ fontSize: '0.875rem', color: '#6B5456', margin: 0, fontFamily: 'Inter, sans-serif' }}>{bookFile ? bookFile.name : 'Drop EPUB or PDF, or click to browse'}</p>
              </div>
              <input id="bookFileInput" type="file" accept=".epub,.pdf" style={{ display: 'none' }} onChange={e => setBookFile(e.target.files[0])} />
              <button type="button" onClick={() => document.getElementById('coverFileInput')?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B5456', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>image</span>
                {coverFile ? coverFile.name : 'Add cover image (optional)'}
              </button>
              <input id="coverFileInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setCoverFile(e.target.files[0])} />
            </form>
          )}

          {/* ── Discover tab ── */}
          {tab === 'discover' && (
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={discoverSrc} onChange={e => setDiscoverSrc(e.target.value)}
                  style={{ ...inputStyle, width: 'auto', flexShrink: 0 }}>
                  <option value="gutenberg">Gutenberg</option>
                  <option value="archive">Archive.org</option>
                  <option value="openlibrary">Open Library</option>
                </select>
                <input
                  placeholder="Search books (e.g. biology, law...)"
                  value={discoverQ}
                  onChange={e => setDiscoverQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDiscover()}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={handleDiscover} disabled={discovering}
                  style={{ background: '#8A1228', color: '#fff', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', flexShrink: 0, opacity: discovering ? 0.6 : 1 }}>
                  {discovering ? '…' : 'Search'}
                </button>
              </div>

              {discovered.length === 0 && !discovering && (
                <p style={{ color: '#A89597', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0', fontFamily: 'Inter, sans-serif' }}>
                  Search for books from Gutenberg, Internet Archive, or Open Library to import them into the DB.
                </p>
              )}

              {discovered.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: '#FDF4F2', borderRadius: '0.5rem', border: '1px solid #EBD2CF' }}>
                  {b.coverUrl
                    ? <img src={b.coverUrl} alt={b.title} style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: '0.25rem', flexShrink: 0 }} />
                    : <div style={{ width: 40, height: 56, background: '#EBD2CF', borderRadius: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ color: '#8A1228', fontSize: '1.25rem' }}>book</span>
                      </div>
                  }
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '0.875rem', fontWeight: 700, color: '#1C0A0C', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6B5456', margin: '2px 0 0' }}>{b.author}</p>
                    {b.alreadyImported && (
                      <span style={{ fontSize: '0.625rem', color: '#388e3c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>Already in library</span>
                    )}
                  </div>
                  {!b.alreadyImported && (
                    <button
                      onClick={() => importMutate(b)}
                      disabled={importing}
                      style={{ background: '#8A1228', color: '#fff', border: 'none', borderRadius: '0.375rem', padding: '0.375rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', flexShrink: 0, opacity: importing ? 0.5 : 1 }}>
                      Import
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Archive ID tab ── */}
          {tab === 'archive' && (
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input placeholder="Title *" value={form.title}   onChange={e => setForm(p => ({ ...p, title: e.target.value }))}  style={inputStyle} />
              <input placeholder="Author *" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={inputStyle} />
              <input placeholder="Internet Archive Identifier (e.g. the-great-gatsby_1925)" value={form.archiveId} onChange={e => setForm(p => ({ ...p, archiveId: e.target.value }))} style={inputStyle} />
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab !== 'discover' && (
          <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #FCE8E6' }}>
            <button onClick={handleSubmit} disabled={isPending || !form.title || !form.author}
              style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', background: '#8A1228', color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: (isPending || !form.title || !form.author) ? 0.5 : 1 }}>
              {isPending ? 'Saving…' : 'Add Book'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditBookModal({ book, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: book.title ?? '', author: book.author ?? '', category: book.category ?? '', isActive: book.isActive ?? true });

  const { mutate, isPending } = useMutation({
    mutationFn: updateBook,
    onSuccess: () => { toast.success('Book updated.'); qc.invalidateQueries(['admin', 'books']); onClose(); },
    onError: () => toast.error('Update failed.'),
  });

  const inputStyle = { width: '100%', border: '1px solid #EBD2CF', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div style={{ background: '#ffffff', borderRadius: '1rem', boxShadow: '0 24px 64px rgba(138,18,40,0.18)', width: '100%', maxWidth: 384, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>Edit Book</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5456' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {[['title', 'Title'], ['author', 'Author']].map(([k, label]) => (
          <div key={k}>
            <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{label}</label>
            <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} />
          </div>
        ))}
        <div>
          <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Category</label>
          <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
            {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B5456', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
          Active
        </label>
        <button onClick={() => mutate({ id: book.id ?? book._id, data: form })} disabled={isPending}
          style={{ padding: '0.625rem', borderRadius: '0.5rem', background: '#8A1228', color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: isPending ? 0.5 : 1 }}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBooksPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [q,       setQ]       = useState('');
  const [page,    setPage]    = useState(1);
  const [panel,   setPanel]   = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey:  ['admin', 'books', { q, page }],
    queryFn:   () => fetchBooks({ q, page, limit: 30 }),
    staleTime: 30_000,
  });

  const { mutate: archive } = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => { toast.success('Book archived.'); qc.invalidateQueries(['admin', 'books']); },
    onError:   () => toast.error('Archive failed.'),
  });

  const books = data?.books ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const bookStatus = b => b.isActive ? 'available' : 'archived';

  return (
    <>
      <style>{`
        .abp-table-row:hover { background: rgba(255,240,240,0.3); }
        .abp-action-btn { opacity: 0; transition: opacity 0.15s; }
        .abp-table-row:hover .abp-action-btn { opacity: 1; }
      `}</style>

      {/* Topbar */}
      <header style={{ position: 'sticky', top: 0, width: '100%', zIndex: 40, height: 80, background: '#FCE8E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', flexShrink: 0, boxSizing: 'border-box' }}>
        <div>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.875rem', fontWeight: 600, color: '#8A1228', margin: 0 }}>Book Management</h2>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>Inventory Control</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B5456', pointerEvents: 'none' }}>search</span>
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search title or author..."
              style={{ background: '#ffffff', border: 'none', outline: 'none', boxShadow: '0 0 0 1px #EBD2CF', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.75rem', fontSize: '0.875rem', width: 288, fontFamily: 'Inter, sans-serif' }}
              onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #8A1228')}
              onBlur={e  => (e.target.style.boxShadow = '0 0 0 1px #EBD2CF')}
            />
          </div>
          <button
            onClick={() => setPanel(true)}
            style={{ background: '#8A1228', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(107,15,26,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Add Book
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(223,191,190,0.3)' }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 2px #ffdad9' }} />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#8A1228', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px #ffdad9' }}>
                  <span style={{ color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem' }}>
                    {(user?.name ?? 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
            }
          </div>
        </div>
      </header>

      <section style={{ padding: '2rem 2rem 6rem' }}>

        {/* Stats bento */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ gridColumn: 'span 4', background: '#ffffff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(74,8,16,0.04)', border: '1px solid rgba(223,191,190,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B5456', margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>Total Volumes</p>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>
                  {isLoading ? '—' : total.toLocaleString()}
                </h3>
              </div>
              <div style={{ padding: '0.75rem', background: '#ffd9dc', borderRadius: '0.5rem', color: '#8A1228' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>library_books</span>
              </div>
            </div>
          </div>
          <div style={{ gridColumn: 'span 8', background: '#8A1228', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(138,18,40,0.2)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #8A1228, #5C0F1F)', opacity: 0.8 }} />
            <div style={{ position: 'relative', zIndex: 1, color: '#fff' }}>
              <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', fontStyle: 'italic', margin: '0 0 0.5rem' }}>"Knowledge is the only wealth that increases when shared."</h4>
              <p style={{ color: 'rgba(255,209,212,0.7)', fontSize: '0.875rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>
                Use "Add Book" to upload files or import from Gutenberg, Archive.org, or Open Library.
              </p>
            </div>
            <div style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.1, color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '10rem' }}>auto_stories</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#ffffff', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(74,8,16,0.04)', border: '1px solid rgba(223,191,190,0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #ffe1e3', background: 'rgba(255,248,247,0.5)' }}>
            <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: '#8A1228', margin: 0 }}>All Books</h3>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#6B5456', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>Loading…</p>
          ) : books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#EBD2CF', display: 'block', marginBottom: '1rem' }}>library_books</span>
              <p style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.125rem', color: '#6B5456', marginBottom: '0.5rem' }}>No books in the library yet.</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#A89597' }}>
                Click "Add Book" → "Discover API" to search and import from Gutenberg, Archive.org, or Open Library.<br/>
                Or run <code style={{ background: '#FDF4F2', padding: '2px 6px', borderRadius: 4 }}>npm run seed</code> in the server directory to auto-import books.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,240,240,0.5)' }}>
                    {['Cover', 'Book Details', 'Category', 'Format', 'Status', 'Actions'].map((col, i) => (
                      <th key={col} style={{ padding: '1rem 1.5rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B5456', width: i === 0 ? 80 : undefined, textAlign: i === 5 ? 'right' : 'left' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid #ffe1e3' }}>
                  {books.map(b => {
                    const status = bookStatus(b);
                    return (
                      <tr key={b.id ?? b._id} className="abp-table-row" style={{ borderBottom: '1px solid #ffe1e3' }}>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ width: 48, height: 64, borderRadius: '0.25rem', overflow: 'hidden', background: '#F2BEB8' }}>
                            {b.coverUrl
                              ? <img src={b.coverUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span className="material-symbols-outlined" style={{ color: '#6B5456', fontSize: '1.25rem' }}>book</span>
                                </div>
                            }
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ display: 'block', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1rem', color: '#8A1228' }}>{b.title}</span>
                          <span style={{ fontSize: '0.875rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>{b.author}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>{b.category ?? '—'}</span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B5456', background: '#ffd9dc', padding: '3px 10px', borderRadius: '0.375rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>
                            {b.fileFormat ?? (b.fileUrl?.endsWith?.('.pdf') ? 'PDF' : 'EPUB')}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'available' ? '#4caf50' : '#ba1a1a' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1C0A0C', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>
                              {status === 'available' ? 'Active' : 'Archived'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div className="abp-action-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setEditing(b)}
                              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: '#6B5456' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#8A1228'; e.currentTarget.style.background = '#FCE8E6'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#6B5456'; e.currentTarget.style.background = 'none'; }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>edit_note</span>
                            </button>
                            <button onClick={() => { if (confirm(`Archive "${b.title}"?`)) archive(b.id ?? b._id); }}
                              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: '#6B5456' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ba1a1a'; e.currentTarget.style.background = '#ffdad6'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#6B5456'; e.currentTarget.style.background = 'none'; }}>
                              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>delete</span>
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
            <div style={{ padding: '1.5rem', background: 'rgba(255,248,247,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ffe1e3' }}>
              <span style={{ fontSize: '0.75rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>
                Page {page} of {pages} ({total.toLocaleString()} books)
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'none', color: '#6B5456', opacity: page === 1 ? 0.3 : 1 }}>
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: page >= pages ? 'not-allowed' : 'pointer', background: 'none', color: '#6B5456', opacity: page >= pages ? 0.3 : 1 }}>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {panel   && <AddBookPanel onClose={() => setPanel(false)} />}
      {editing && <EditBookModal book={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
