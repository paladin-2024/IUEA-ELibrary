import { useState, useRef }                  from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiUpload, FiLink, FiBook,
  FiChevronLeft, FiChevronRight, FiLoader,
} from 'react-icons/fi';
import api   from '../../services/api';
import toast from 'react-hot-toast';

// ── API helpers ───────────────────────────────────────────────────────────────
const fetchBooks = (params) => api.get('/admin/books', { params }).then((r) => r.data);
const deleteBook = (id)     => api.delete(`/admin/books/${id}`).then((r) => r.data);
const updateBook = ({ id, data }) => api.patch(`/admin/books/${id}`, data).then((r) => r.data);
const uploadBook = (formData)   => api.post('/admin/books', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
}).then((r) => r.data);

const SOURCES = [
  { key: '',          label: 'All'       },
  { key: 'koha',      label: 'Koha'      },
  { key: 'upload',    label: 'Uploaded'  },
  { key: 'archive',   label: 'Archive'   },
  { key: 'gutenberg', label: 'Gutenberg' },
];

const SOURCE_BADGE = {
  koha:      'bg-blue-50 text-blue-600',
  upload:    'bg-green-50 text-green-600',
  archive:   'bg-yellow-50 text-yellow-700',
  gutenberg: 'bg-purple-50 text-purple-600',
};

function sourceBadge(book) {
  if (book.kohaId)      return { label: 'Koha',      cls: SOURCE_BADGE.koha      };
  if (book.fileUrl)     return { label: 'Uploaded',  cls: SOURCE_BADGE.upload    };
  if (book.archiveId)   return { label: 'Archive',   cls: SOURCE_BADGE.archive   };
  if (book.gutenbergId) return { label: 'Gutenberg', cls: SOURCE_BADGE.gutenberg };
  return { label: 'Manual', cls: 'bg-gray-100 text-gray-500' };
}

// ── Upload slide-over ─────────────────────────────────────────────────────────
function AddBookPanel({ onClose }) {
  const qc = useQueryClient();
  const [tab, setTab]     = useState('upload');   // upload | koha | archive
  const [form, setForm]   = useState({
    title: '', author: '', description: '', category: 'General',
    faculty: '', tags: '', languages: 'English', publishedYear: '',
    kohaId: '', archiveId: '',
  });
  const bookRef  = useRef(null);
  const coverRef = useRef(null);
  const [bookFile,  setBookFile]  = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [dragging, setDragging]   = useState(false);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: uploadBook,
    onSuccess: () => {
      toast.success('Book added.');
      qc.invalidateQueries(['admin', 'books']);
      onClose();
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Upload failed.'),
  });

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setBookFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (bookFile)  fd.append('bookFile',  bookFile);
    if (coverFile) fd.append('coverFile', coverFile);
    submit(fd);
  };

  const field = (k, placeholder, type = 'text') => (
    <input
      type={type}
      placeholder={placeholder}
      value={form[k]}
      onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Add Book</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <FiX size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-5">
          {[
            { k: 'upload',  label: 'Upload',     icon: FiUpload },
            { k: 'koha',    label: 'Link Koha',  icon: FiLink   },
            { k: 'archive', label: 'From Archive', icon: FiBook },
          ].map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === k
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* Common fields */}
          {field('title', 'Title *')}
          {field('author', 'Author *')}
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            {field('category', 'Category')}
            {field('publishedYear', 'Year', 'number')}
          </div>
          {field('faculty', 'Faculty (comma-separated)')}
          {field('languages', 'Languages (comma-separated)')}
          {field('tags', 'Tags (comma-separated)')}

          {/* Tab-specific */}
          {tab === 'upload' && (
            <div className="space-y-2 pt-1">
              {/* Drag-drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => bookRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FiUpload size={20} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  {bookFile ? bookFile.name : 'Drop EPUB or PDF, or click to browse'}
                </p>
              </div>
              <input ref={bookRef} type="file" accept=".epub,.pdf" className="hidden"
                onChange={(e) => setBookFile(e.target.files[0])} />

              <button
                type="button"
                onClick={() => coverRef.current?.click()}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiUpload size={13} />
                {coverFile ? coverFile.name : 'Add cover image (optional)'}
              </button>
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => setCoverFile(e.target.files[0])} />
            </div>
          )}

          {tab === 'koha' && (
            <div className="pt-1">
              <label className="text-xs text-gray-500 mb-1 block">Koha Biblio ID</label>
              {field('kohaId', 'e.g. 12345')}
            </div>
          )}

          {tab === 'archive' && (
            <div className="pt-1">
              <label className="text-xs text-gray-500 mb-1 block">Internet Archive Identifier</label>
              {field('archiveId', 'e.g. the-great-gatsby_1925')}
            </div>
          )}
        </form>

        <div className="px-5 pb-5">
          <button
            onClick={handleSubmit}
            disabled={isPending || !form.title || !form.author}
            className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <><FiLoader size={14} className="animate-spin" /> Saving…</> : 'Add Book'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditBookModal({ book, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title:    book.title  ?? '',
    author:   book.author ?? '',
    category: book.category ?? '',
    isActive: book.isActive ?? true,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: updateBook,
    onSuccess: () => {
      toast.success('Book updated.');
      qc.invalidateQueries(['admin', 'books']);
      onClose();
    },
    onError: () => toast.error('Update failed.'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Edit Book</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <FiX size={16} />
          </button>
        </div>
        {[
          ['title',    'Title'],
          ['author',   'Author'],
          ['category', 'Category'],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <input
              value={form[k]}
              onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            className="rounded"
          />
          Active
        </label>
        <button
          onClick={() => mutate({ id: book._id, data: form })}
          disabled={isPending}
          className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminBooksPage() {
  const qc = useQueryClient();
  const [source, setSource] = useState('');
  const [q,      setQ]      = useState('');
  const [page,   setPage]   = useState(1);
  const [panel,  setPanel]  = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'books', { source, q, page }],
    queryFn:  () => fetchBooks({ source, q, page, limit: 30 }),
    staleTime: 30_000,
  });

  const { mutate: archive } = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      toast.success('Book archived.');
      qc.invalidateQueries(['admin', 'books']);
    },
    onError: () => toast.error('Archive failed.'),
  });

  const books = data?.books ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Books</h1>
        <button
          onClick={() => setPanel(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
        >
          <FiPlus size={15} /> Add Book
        </button>
      </div>

      {/* Source tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {SOURCES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setSource(key); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              source === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="Search books…"
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {isLoading ? (
          <p className="text-sm text-gray-400 p-8 text-center">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Cover</th>
                  <th className="px-4 py-3 font-medium">Title / Author</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Languages</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {books.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-gray-400">
                      No books found.
                    </td>
                  </tr>
                ) : books.map((b) => {
                  const badge = sourceBadge(b);
                  return (
                    <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        {b.coverUrl
                          ? <img src={b.coverUrl} alt={b.title}
                              className="w-8 h-11 object-cover rounded shadow-sm" />
                          : <div className="w-8 h-11 rounded bg-gray-100 flex items-center justify-center">
                              <FiBook size={14} className="text-gray-400" />
                            </div>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{b.title}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{b.author}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{b.category}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {(b.languages ?? []).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          b.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {b.isActive ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditing(b)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Archive "${b.title}"?`)) archive(b._id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <FiTrash2 size={14} />
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>{total.toLocaleString()} books</span>
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

      {panel   && <AddBookPanel onClose={() => setPanel(false)} />}
      {editing && <EditBookModal book={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
