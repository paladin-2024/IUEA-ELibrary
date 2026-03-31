import { useState, useEffect } from 'react';
import { FiTrash2, FiDownload, FiLoader } from 'react-icons/fi';
import { HiOutlineCheckCircle }            from 'react-icons/hi';

const STORAGE_KEY = 'iuea_downloads';
const MAX_BYTES   = 500 * 1024 * 1024; // 500 MB display cap

function getDownloads() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function saveDownloads(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState([]);

  useEffect(() => { setDownloads(getDownloads()); }, []);

  const remove = (id) => {
    const next = downloads.filter((d) => d.id !== id);
    saveDownloads(next);
    setDownloads(next);
  };

  const usedBytes = downloads
    .filter((d) => d.status === 'downloaded')
    .reduce((sum, d) => sum + (d.sizeBytes ?? 0), 0);

  const usedMB   = (usedBytes / (1024 * 1024)).toFixed(1);
  const usedPct  = Math.min((usedBytes / MAX_BYTES) * 100, 100);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-primary mb-5">Downloads</h1>

      {/* ── Storage usage bar ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-card shadow-card p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Storage used</span>
          <span className="text-sm text-gray-500">{usedMB} MB / 500 MB</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          Downloaded books are stored for offline reading.
        </p>
      </div>

      {/* ── File list ─────────────────────────────────────────────────────── */}
      {downloads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
            <FiDownload size={28} className="text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">No downloads yet.</p>
          <p className="text-xs text-gray-400">
            Open a book and tap the download icon to save for offline reading.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {downloads.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 bg-white rounded-card shadow-card px-4 py-3"
            >
              {/* Cover thumbnail */}
              {d.coverUrl
                ? <img src={d.coverUrl} alt={d.title}
                    className="w-10 h-14 object-cover rounded flex-shrink-0" />
                : <div className="w-10 h-14 rounded bg-primary/10 flex-shrink-0" />
              }

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                <p className="text-xs text-gray-500 truncate">{d.author}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {d.sizeBytes ? `${(d.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '--'}
                </p>
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {d.status === 'downloaded' && (
                  <HiOutlineCheckCircle size={20} className="text-green-500" />
                )}
                {d.status === 'downloading' && (
                  <FiLoader size={18} className="text-primary animate-spin" />
                )}
                {d.status === 'pending' && (
                  <FiDownload size={18} className="text-gray-400" />
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => remove(d.id)}
                className="flex-shrink-0 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Remove download"
              >
                <FiTrash2 size={16} className="text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
