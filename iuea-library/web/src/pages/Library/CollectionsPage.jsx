import { useState, useEffect } from 'react';
import { FiPlus, FiX, FiBookOpen } from 'react-icons/fi';

const STORAGE_KEY = 'iuea_collections';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}
function save(cols) { localStorage.setItem(STORAGE_KEY, JSON.stringify(cols)); }

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [showModal, setShowModal]     = useState(false);
  const [name, setName]               = useState('');

  useEffect(() => { setCollections(load()); }, []);

  const create = () => {
    if (!name.trim()) return;
    const next = [...collections, { id: Date.now(), name: name.trim(), books: [] }];
    save(next);
    setCollections(next);
    setName('');
    setShowModal(false);
  };

  const remove = (id) => {
    const next = collections.filter((c) => c.id !== id);
    save(next);
    setCollections(next);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-bold text-primary">Collections</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <FiPlus size={16} />
          New Collection
        </button>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {collections.map((col) => (
          <CollectionCard key={col.id} col={col} onRemove={() => remove(col.id)} />
        ))}

        {/* Dashed "new" card */}
        <button
          onClick={() => setShowModal(true)}
          className="aspect-[3/4] rounded-card border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 group-hover:border-primary flex items-center justify-center">
            <FiPlus size={18} className="text-gray-400 group-hover:text-primary" />
          </div>
          <span className="text-xs text-gray-400 group-hover:text-primary font-medium">
            New Collection
          </span>
        </button>
      </div>

      {/* ── Create modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-card shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">New Collection</h2>
              <button
                onClick={() => { setShowModal(false); setName(''); }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={18} className="text-gray-500" />
              </button>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && create()}
              placeholder="Collection name…"
              autoFocus
              className="w-full rounded-input border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => { setShowModal(false); setName(''); }}
                className="flex-1 py-2 rounded-btn border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={!name.trim()}
                className="flex-1 py-2 rounded-btn bg-primary text-white text-sm font-medium hover:bg-primary-dark disabled:opacity-40 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CollectionCard({ col, onRemove }) {
  // Show up to 3 stacked cover placeholders
  const covers = col.books?.slice(0, 3) ?? [];

  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden group relative">
      {/* Stacked covers */}
      <div className="aspect-[3/4] bg-surface relative flex items-end justify-center pb-2">
        {covers.length === 0 ? (
          <FiBookOpen size={36} className="text-gray-300 mb-6" />
        ) : (
          covers.map((b, i) => (
            <div
              key={i}
              className="absolute w-3/5 rounded-lg shadow overflow-hidden"
              style={{
                bottom: `${16 + i * 10}px`,
                left:   `${20 - i * 8}px`,
                zIndex: i,
                opacity: 1 - i * 0.15,
              }}
            >
              {b.coverUrl
                ? <img src={b.coverUrl} alt="" className="w-full aspect-[2/3] object-cover" />
                : <div className="w-full aspect-[2/3] bg-primary/20" />
              }
            </div>
          ))
        )}
      </div>

      {/* Label */}
      <div className="px-3 py-2">
        <p className="text-sm font-semibold text-gray-900 truncate">{col.name}</p>
        <p className="text-xs text-gray-400">{col.books?.length ?? 0} books</p>
      </div>

      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center transition-opacity"
      >
        <FiX size={14} className="text-gray-500" />
      </button>
    </div>
  );
}
