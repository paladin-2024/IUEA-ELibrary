import { useEffect, useState }    from 'react';
import { useNavigate }            from 'react-router-dom';
import { FiTrash2, FiBookOpen, FiDownload } from 'react-icons/fi';
import useLibraryStore            from '../../store/libraryStore';
import EmptyState                 from '../../components/ui/EmptyState';

function exportHighlights(highlights) {
  const lines = highlights.map((h, i) =>
    `[${i + 1}] ${h.bookTitle ?? 'Unknown Book'}\n"${h.text}"\n${h.cfi ? `Location: ${h.cfi}` : ''}\n`
  );
  const blob = new Blob([`MY HIGHLIGHTS\nExported ${new Date().toLocaleDateString()}\n\n${lines.join('\n')}`], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'highlights.txt'; a.click();
  URL.revokeObjectURL(url);
}

export default function HighlightsPage() {
  const navigate = useNavigate();
  const { highlights, isLoading, fetchHighlights, deleteHighlight } = useLibraryStore();
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { fetchHighlights(); }, []);

  const handleDelete = async (id) => {
    setDeleting(id);
    await deleteHighlight(id);
    setDeleting(null);
  };

  return (
    <div className="px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">My Highlights</h1>
            <p className="text-sm text-gray-500">Passages you've marked while reading</p>
          </div>
          {highlights.length > 0 && (
            <button
              onClick={() => exportHighlights(highlights)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #E5E7EB', background: '#fff', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <FiDownload size={14} /> Export
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-card animate-pulse" />
            ))}
          </div>
        ) : highlights.length === 0 ? (
          <EmptyState
            icon={<FiBookOpen size={32} className="text-primary/40" />}
            title="No highlights yet"
            description="Select text while reading to save highlights here."
          />
        ) : (
          <div className="space-y-3">
            {highlights.map((h) => (
              <div
                key={h._id}
                className="bg-white border border-gray-100 rounded-card p-4 shadow-sm group"
              >
                {/* Quote */}
                <blockquote className="border-l-4 border-accent pl-3 text-gray-700 text-sm leading-relaxed italic">
                  {h.text}
                </blockquote>

                {/* Book link + delete */}
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => navigate(`/books/${h.bookId}`)}
                    className="text-xs text-primary hover:underline line-clamp-1"
                  >
                    {h.bookTitle ?? 'View book'}
                  </button>

                  <button
                    onClick={() => handleDelete(h._id)}
                    disabled={deleting === h._id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 p-1"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>

                {/* Page / location */}
                {h.cfi && (
                  <p className="text-[10px] text-gray-400 mt-1">Location: {h.cfi}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
