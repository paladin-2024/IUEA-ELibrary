import { useState, useRef }                  from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api   from '../../services/api';
import toast from 'react-hot-toast';

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchBooks = (params)       => api.get('/admin/books',        { params }).then(r => r.data);
const deleteBook = (id)           => api.delete(`/admin/books/${id}`).then(r => r.data);
const updateBook = ({ id, data }) => api.patch(`/admin/books/${id}`, data).then(r => r.data);
const uploadBook = (formData)     => api.post('/admin/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

const ADMIN_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHsE9WpXIrb8W03ZjvxPOfkpJqFeFOoU3Anqk1g1AGTb9tfNbrWQVFvnh_LXjKTw322WtJR0wMnckv8zqpHjXXmL5qvqFaZ0uNc1gQf5XSFE0v2Iw9uiOS1Rqq0CzFQ2TZLFa_6M6a6o07_pmkpMt4Oox9LrZ_QsMiSgQyvrFkjXTXBfn-6zs52cbPMZuNOqbVXw4FMsrlaCna_W3SNyINnrSrJvwhjOXphLYWU-ftcJA1VztWSLQGgHfpIHV9b2SOGjLQ3bDoF7Y';

const STATIC_BOOKS = [
  {
    _id: 'b1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    languages: ['English', 'French'],
    format: 'EPUB',
    isActive: true,
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCh9AQfJqtgLcmA-PyRBSRxJETftCOiVScOsdvdnoolWtvPmZ-5X-m_mRTYJxPqpXaEj5naSfRe3kOTylPTA9l0Y6bb59FrvCGBUwRQjUt0FwhVi8dFTq55irSuF35zVRPpA0Gd5co2DWcOFPw17_Y_ChX_7Qd2_AAMpHmbVENB2HlG6BKu0wZCfyCR5CdyT7oo-AsvSGKdq_XoelQDt8R3ovJx9YFGGkv3PQRbrUcgKLh3WetOnhzNOqFhNK1OXhKoGrvGFtENZcQ',
    status: 'available',
  },
  {
    _id: 'b2',
    title: 'African History 101',
    author: 'Dr. Amara Okoro',
    languages: ['English', 'Swahili', 'Luganda'],
    format: 'PDF',
    isActive: true,
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdNfTa5GuwKh3IpyAaitQHI5KoOjDgzMxPcfndt-LUGuprhm9n-lYF4NlYrIkZvvMu4WpPNFh_RzQeOpilS9u7R2Qi53YMckWD3aAG64jSSTw7tXLvPITIcZjscYtHLGvaifztELTdYQ1ke91sXcf8QIDeIXgnjpSr6WsGD192dUC-7bmRHe-1ahDPXiuCNKNYvl8VqSA5Fqa3CsyJLGQ-3dQa2EP8GqRONieys0dPKp5Vt-xe1KC37aLodMNRG5efColjj-F7pMM',
    status: 'reserved',
  },
  {
    _id: 'b3',
    title: 'Advanced Physics',
    author: 'Prof. Marcus Thorne',
    languages: ['English'],
    format: 'EPUB',
    isActive: true,
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsOOhdnYlmW_xD80u3AZpBnUtSO74Mcs3qScztNuya7iU6R9pbKgnvmeLQt9SoZ_8ZAyH-bqS2oL57B-VjX5mb4aNnaMqVXikXHGh-bliI8dVVTw5XkktCbysuZmDim6DBgXHK66Vj1nTj1sABn2QjlXJcVBMR6biTg2htyi6apSRAXHUXgDEY-4DNgzizUSxFCkTEIYc0hG4eOsIlo8HDZzPe-t3LGnge-3yVbc6pEanWKZwxWnhfohI5iHJTnEmRBURjV4Gc5C0',
    status: 'available',
  },
];

// ── Add Book Panel ────────────────────────────────────────────────────────────
function AddBookPanel({ onClose }) {
  const qc = useQueryClient();
  const [tab,  setTab]  = useState('upload');
  const [form, setForm] = useState({ title: '', author: '', description: '', category: 'General', faculty: '', tags: '', languages: 'English', publishedYear: '', kohaId: '', archiveId: '' });
  const bookRef  = useRef(null);
  const coverRef = useRef(null);
  const [bookFile,  setBookFile]  = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [dragging, setDragging]   = useState(false);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: uploadBook,
    onSuccess: () => { toast.success('Book added.'); qc.invalidateQueries(['admin', 'books']); onClose(); },
    onError: e => toast.error(e?.response?.data?.message ?? 'Upload failed.'),
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

  const inputStyle = { width: '100%', border: '1px solid #EBD2CF', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex' }}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{ width: '100%', maxWidth: 448, background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '-4px 0 40px rgba(138,18,40,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #FCE8E6' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.25rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>Add Book</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B5456' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #FCE8E6', padding: '0 1.5rem' }}>
          {[['upload', 'Upload', 'upload'], ['koha', 'Link Koha', 'link'], ['archive', 'From Archive', 'inventory_2']].map(([k, label, icon]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.75rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer', background: 'none', borderBottom: `2px solid ${tab === k ? '#8A1228' : 'transparent'}`, color: tab === k ? '#8A1228' : '#6B5456', fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{icon}</span> {label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
          <input placeholder="Author *" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} style={inputStyle} />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <input placeholder="Category" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle} />
            <input placeholder="Year" type="number" value={form.publishedYear} onChange={e => setForm(p => ({ ...p, publishedYear: e.target.value }))} style={inputStyle} />
          </div>
          <input placeholder="Faculty (comma-separated)" value={form.faculty} onChange={e => setForm(p => ({ ...p, faculty: e.target.value }))} style={inputStyle} />
          <input placeholder="Languages (comma-separated)" value={form.languages} onChange={e => setForm(p => ({ ...p, languages: e.target.value }))} style={inputStyle} />
          <input placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} style={inputStyle} />

          {tab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => bookRef.current?.click()}
                style={{ border: `2px dashed ${dragging ? '#8A1228' : '#EBD2CF'}`, borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', background: dragging ? 'rgba(138,18,40,0.04)' : 'transparent' }}
              >
                <span className="material-symbols-outlined" style={{ color: '#6B5456', display: 'block', marginBottom: '0.5rem' }}>upload</span>
                <p style={{ fontSize: '0.875rem', color: '#6B5456', margin: 0, fontFamily: 'Inter, sans-serif' }}>{bookFile ? bookFile.name : 'Drop EPUB or PDF, or click to browse'}</p>
              </div>
              <input ref={bookRef} type="file" accept=".epub,.pdf" style={{ display: 'none' }} onChange={e => setBookFile(e.target.files[0])} />
              <button type="button" onClick={() => coverRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B5456', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>image</span>
                {coverFile ? coverFile.name : 'Add cover image (optional)'}
              </button>
              <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setCoverFile(e.target.files[0])} />
            </div>
          )}
          {tab === 'koha' && (
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Koha Biblio ID</label>
              <input placeholder="e.g. 12345" value={form.kohaId} onChange={e => setForm(p => ({ ...p, kohaId: e.target.value }))} style={inputStyle} />
            </div>
          )}
          {tab === 'archive' && (
            <div>
              <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>Internet Archive Identifier</label>
              <input placeholder="e.g. the-great-gatsby_1925" value={form.archiveId} onChange={e => setForm(p => ({ ...p, archiveId: e.target.value }))} style={inputStyle} />
            </div>
          )}
        </form>
        <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
          <button onClick={handleSubmit} disabled={isPending || !form.title || !form.author}
            style={{ width: '100%', padding: '0.625rem', borderRadius: '0.5rem', background: '#5C0F1F', color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: (isPending || !form.title || !form.author) ? 0.5 : 1 }}>
            {isPending ? 'Saving…' : 'Add Book'}
          </button>
        </div>
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
        {[['title', 'Title'], ['author', 'Author'], ['category', 'Category']].map(([k, label]) => (
          <div key={k}>
            <label style={{ fontSize: '0.75rem', color: '#6B5456', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{label}</label>
            <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} />
          </div>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B5456', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
          Active
        </label>
        <button onClick={() => mutate({ id: book._id, data: form })} disabled={isPending}
          style={{ padding: '0.625rem', borderRadius: '0.5rem', background: '#5C0F1F', color: '#fff', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', opacity: isPending ? 0.5 : 1 }}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBooksPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [q,         setQ]         = useState('');
  const [page,      setPage]      = useState(1);
  const [panel,     setPanel]     = useState(false);
  const [editing,   setEditing]   = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'books', { q, page, activeTab }],
    queryFn:  () => fetchBooks({ q, page, limit: 30 }),
    staleTime: 30_000,
  });

  const { mutate: archive } = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => { toast.success('Book archived.'); qc.invalidateQueries(['admin', 'books']); },
    onError:   () => toast.error('Archive failed.'),
  });

  const apiBooks = data?.books ?? [];
  const total    = data?.total ?? 0;
  const pages    = data?.pages ?? 1;
  const books    = apiBooks.length > 0 ? apiBooks : STATIC_BOOKS;

  const bookStatus = b => b.status ?? (b.isActive ? 'available' : 'archived');

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
              placeholder="Search title, author or ISBN..."
              style={{ background: '#ffffff', border: 'none', outline: 'none', boxShadow: '0 0 0 1px #EBD2CF', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.75rem', fontSize: '0.875rem', width: 288, fontFamily: 'Inter, sans-serif' }}
              onFocus={e => (e.target.style.boxShadow = '0 0 0 2px #8A1228')}
              onBlur={e  => (e.target.style.boxShadow = '0 0 0 1px #EBD2CF')}
            />
          </div>
          <button
            onClick={() => setPanel(true)}
            style={{ background: '#5C0F1F', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, fontFamily: 'Inter, sans-serif', boxShadow: '0 4px 12px rgba(107,15,26,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Add Book
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid rgba(223,191,190,0.3)' }}>
            <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#6B5456', padding: '0.5rem' }}>
              <span className="material-symbols-outlined">notifications</span>
              <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, background: '#ba1a1a', borderRadius: '50%' }} />
            </button>
            <img src={ADMIN_AVATAR} alt="Admin" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 0 0 2px #ffdad9' }} />
          </div>
        </div>
      </header>

      <section style={{ padding: '2rem 2rem 6rem' }}>

        {/* Stats bento */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {/* Total Volumes */}
          <div style={{ gridColumn: 'span 4', background: '#ffffff', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(74,8,16,0.04)', border: '1px solid rgba(223,191,190,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6B5456', margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>Total Volumes</p>
                <h3 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '2.25rem', fontWeight: 700, color: '#8A1228', margin: 0 }}>{total > 0 ? total.toLocaleString() : '12,482'}</h3>
              </div>
              <div style={{ padding: '0.75rem', background: '#ffd9dc', borderRadius: '0.5rem', color: '#8A1228' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>library_books</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#388e3c', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>trending_up</span>
              <span>14% increase this semester</span>
            </div>
          </div>
          {/* Quote banner */}
          <div style={{ gridColumn: 'span 8', background: '#8A1228', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(138,18,40,0.2)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #8A1228, #5C0F1F)', opacity: 0.8 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
              <div style={{ maxWidth: '28rem' }}>
                <h4 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '1.5rem', marginBottom: '0.5rem', fontStyle: 'italic', margin: '0 0 0.5rem' }}>"Knowledge is the only wealth that increases when shared."</h4>
                <p style={{ color: 'rgba(255,209,212,0.7)', fontSize: '0.875rem', margin: 0, fontFamily: 'Inter, sans-serif' }}>Reviewing 42 pending book acquisitions from the Humanities department.</p>
              </div>
              <button style={{ background: '#B8964A', color: '#503d00', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
              >
                Review Requests
              </button>
            </div>
            <div style={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.1, color: '#fff' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '10rem' }}>auto_stories</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#ffffff', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(74,8,16,0.04)', border: '1px solid rgba(223,191,190,0.1)', overflow: 'hidden' }}>
          {/* Table header with tabs */}
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #ffe1e3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,248,247,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {[['all', 'All Books'], ['recent', 'Recently Added'], ['outofstock', 'Out of Stock']].map(([k, label]) => (
                <button key={k} onClick={() => setActiveTab(k)}
                  style={{ fontSize: '0.875rem', fontWeight: activeTab === k ? 700 : 500, color: activeTab === k ? '#8A1228' : '#6B5456', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `2px solid ${activeTab === k ? '#8A1228' : 'transparent'}`, paddingBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                  {label}
                </button>
              ))}
            </div>
            <button style={{ padding: '0.5rem', color: '#6B5456', background: 'none', border: '1px solid rgba(223,191,190,0.2)', borderRadius: '0.5rem', cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>filter_list</span>
            </button>
          </div>

          {isLoading ? (
            <p style={{ textAlign: 'center', color: '#6B5456', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>Loading…</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,240,240,0.5)' }}>
                    {['Cover', 'Book Details', 'Languages', 'Format', 'Status', 'Actions'].map((col, i) => (
                      <th key={col} style={{
                        padding: '1rem 1.5rem',
                        fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.6875rem',
                        textTransform: 'uppercase', letterSpacing: '0.15em', color: '#6B5456',
                        width: i === 0 ? 80 : undefined,
                        textAlign: i === 5 ? 'right' : 'left',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ borderTop: '1px solid #ffe1e3' }}>
                  {books.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>No books found.</td></tr>
                  ) : books.map(b => {
                    const status = bookStatus(b);
                    const langs  = b.languages ?? [];
                    return (
                      <tr key={b._id} className="abp-table-row" style={{ borderBottom: '1px solid #ffe1e3' }}>
                        {/* Cover */}
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ width: 48, height: 64, borderRadius: '0.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', overflow: 'hidden', background: '#F2BEB8' }}>
                            {b.coverUrl
                              ? <img src={b.coverUrl} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <span className="material-symbols-outlined" style={{ color: '#6B5456', fontSize: '1.25rem' }}>book</span>
                                </div>
                            }
                          </div>
                        </td>
                        {/* Book Details */}
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ display: 'block', fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 700, fontSize: '1.125rem', color: '#8A1228', cursor: 'pointer' }}
                            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                          >{b.title}</span>
                          <span style={{ fontSize: '0.875rem', color: '#6B5456', fontFamily: 'Inter, sans-serif' }}>{b.author}</span>
                        </td>
                        {/* Languages */}
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {langs.length > 0 ? langs.map((lang, i) => (
                              <span key={lang} style={{
                                padding: '2px 8px',
                                background: i === 0 ? '#5C0F1F' : 'rgba(107,15,26,0.1)',
                                color: i === 0 ? '#fff' : '#5C0F1F',
                                borderRadius: 9999, fontSize: '0.625rem', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                fontFamily: 'Inter, sans-serif',
                              }}>{lang}</span>
                            )) : <span style={{ color: '#6B5456', fontSize: '0.875rem' }}>—</span>}
                          </div>
                        </td>
                        {/* Format */}
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B5456', background: '#ffd9dc', padding: '3px 10px', borderRadius: '0.375rem', fontFamily: 'Inter, sans-serif' }}>
                            {b.format ?? (b.fileUrl?.endsWith('.pdf') ? 'PDF' : 'EPUB')}
                          </span>
                        </td>
                        {/* Status */}
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'available' ? '#4caf50' : status === 'reserved' ? '#ff9800' : '#ba1a1a' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1C0A0C', fontFamily: 'Inter, sans-serif', textTransform: 'capitalize' }}>
                              {status === 'available' ? 'Available' : status === 'reserved' ? 'Reserved' : 'Archived'}
                            </span>
                          </div>
                        </td>
                        {/* Actions */}
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                          <div className="abp-action-btn" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setEditing(b)}
                              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: '#6B5456' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#8A1228'; e.currentTarget.style.background = '#FCE8E6'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#6B5456'; e.currentTarget.style.background = 'none'; }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>edit_note</span>
                            </button>
                            <button onClick={() => { if (confirm(`Archive "${b.title}"?`)) archive(b._id); }}
                              style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: '#6B5456' }}
                              onMouseEnter={e => { e.currentTarget.style.color = '#ba1a1a'; e.currentTarget.style.background = '#ffdad6'; }}
                              onMouseLeave={e => { e.currentTarget.style.color = '#6B5456'; e.currentTarget.style.background = 'none'; }}
                            >
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
          <div style={{ padding: '1.5rem', background: 'rgba(255,248,247,0.5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ffe1e3' }}>
            <span style={{ fontSize: '0.75rem', color: '#6B5456', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
              {total > 0 ? `Showing 1-${Math.min(30, total)} of ${total.toLocaleString()} books` : 'Showing 1-10 of 482 books'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', background: 'none', color: '#6B5456', opacity: page === 1 ? 0.3 : 1 }}>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => setPage(n)}
                  style={{ width: 32, height: 32, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: page === n ? '#8A1228' : 'none', color: page === n ? '#fff' : '#6B5456', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>
                  {n}
                </button>
              ))}
              <span style={{ padding: '0 0.5rem', color: '#6B5456' }}>…</span>
              <button style={{ width: 32, height: 32, borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: '#6B5456', fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Inter, sans-serif' }}>48</button>
              <button onClick={() => setPage(p => Math.min(pages || 48, p + 1))}
                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', background: 'none', color: '#6B5456' }}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy', 'Terms', 'Translate', 'Books API'].map(link => (
              <a key={link} href="#" style={{ color: 'rgba(138,18,40,0.5)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#5C0F1F')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(138,18,40,0.5)')}
              >{link}</a>
            ))}
          </div>
          <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(138,18,40,0.3)', margin: 0, fontFamily: 'Inter, sans-serif' }}>Powered by Google</p>
        </footer>
      </section>

      {panel   && <AddBookPanel onClose={() => setPanel(false)} />}
      {editing && <EditBookModal book={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
