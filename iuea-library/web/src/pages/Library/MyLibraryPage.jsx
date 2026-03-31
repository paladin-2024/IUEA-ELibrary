import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { FiBookOpen }          from 'react-icons/fi';
import api                      from '../../services/api';

const TABS = ['All', 'Reading', 'Finished', 'Saved'];

export default function MyLibraryPage() {
  const navigate                  = useNavigate();
  const [tab, setTab]             = useState('All');
  const [progress, setProgress]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/progress')
      .then(({ data }) => setProgress(data.progress ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = progress.filter((p) => {
    const pct = p.percentComplete ?? 0;
    if (tab === 'Reading')  return pct > 0 && !p.isCompleted;
    if (tab === 'Finished') return p.isCompleted;
    if (tab === 'Saved')    return pct === 0;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-primary mb-5">My Library</h1>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex border-b border-gray-200 mb-5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const b = p.bookId;
            if (!b) return null;
            const pct = Math.round(p.percentComplete ?? 0);

            return (
              <div
                key={p._id}
                onClick={() => navigate(`/reader/${b._id ?? b.id}`)}
                className="flex items-center gap-4 bg-white rounded-card shadow-card p-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Cover */}
                {b.coverUrl
                  ? <img src={b.coverUrl} alt={b.title}
                      className="w-14 h-20 object-cover rounded-lg flex-shrink-0" />
                  : <div className="w-14 h-20 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FiBookOpen size={24} className="text-primary" />
                    </div>
                }

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{b.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{b.author}</p>
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{pct}% complete</p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  className="flex-shrink-0 px-3 py-1.5 rounded-btn bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
                  onClick={(e) => { e.stopPropagation(); navigate(`/reader/${b._id ?? b.id}`); }}
                >
                  {p.isCompleted ? 'Read Again' : 'Continue'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }) {
  const messages = {
    All:      'No books yet. Start reading from the Library!',
    Reading:  'No books in progress. Open a book to start.',
    Finished: "You haven't finished any books yet.",
    Saved:    'No saved books yet.',
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
        <FiBookOpen size={28} className="text-gray-300" />
      </div>
      <p className="text-sm text-gray-500">{messages[tab]}</p>
    </div>
  );
}
