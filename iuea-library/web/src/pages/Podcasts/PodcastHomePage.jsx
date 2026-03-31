import { useState, useEffect, useRef } from 'react';
import { useNavigate }                  from 'react-router-dom';
import { BsMicFill }                    from 'react-icons/bs';
import { FiPlay }                       from 'react-icons/fi';
import api                               from '../../services/api';

const CATEGORIES = ['All', 'Education', 'Science', 'Literature', 'Law', 'Technology', 'Culture'];
const RECENT_KEY = 'iuea_recent_episodes';

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); }
  catch { return []; }
}

export default function PodcastHomePage() {
  const navigate                        = useNavigate();
  const [podcasts, setPodcasts]         = useState([]);
  const [subscriptions, setSubs]        = useState([]);
  const [category, setCategory]         = useState('All');
  const [loading, setLoading]           = useState(true);
  const [recent]                        = useState(getRecent);

  useEffect(() => {
    setLoading(true);
    const params = category !== 'All' ? { category } : {};
    Promise.all([
      api.get('/podcasts', { params }),
      api.get('/podcasts/subscriptions').catch(() => ({ data: { podcasts: [] } })),
    ]).then(([p, s]) => {
      setPodcasts(p.data.podcasts ?? []);
      setSubs(s.data.podcasts ?? []);
    }).finally(() => setLoading(false));
  }, [category]);

  const featured = podcasts[0] ?? null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-serif text-2xl font-bold text-primary">Podcasts</h1>

      {/* ── Featured banner ──────────────────────────────────────────────── */}
      {featured && (
        <div
          onClick={() => navigate(`/podcasts/${featured._id}`)}
          className="relative rounded-card overflow-hidden cursor-pointer h-44 flex items-end"
          style={{ background: 'linear-gradient(135deg, #7B0D1E 0%, #4A0810 100%)' }}
        >
          {featured.coverUrl && (
            <img
              src={featured.coverUrl} alt={featured.title}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          )}
          <div className="relative z-10 p-5 flex items-end gap-4 w-full">
            {featured.coverUrl
              ? <img src={featured.coverUrl} alt=""
                  className="w-16 h-16 rounded-lg object-cover shadow-lg flex-shrink-0" />
              : <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <BsMicFill size={24} className="text-accent" />
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/60 uppercase tracking-wide font-medium">
                Featured
              </p>
              <p className="text-white font-bold text-base leading-tight truncate">
                {featured.title}
              </p>
              <p className="text-white/60 text-xs mt-0.5 truncate">
                {featured.author || featured.hostName}
              </p>
            </div>
            <button className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-btn bg-accent text-primary-dark text-sm font-bold hover:bg-accent-light transition-colors">
              <FiPlay size={14} />
              Listen
            </button>
          </div>
        </div>
      )}

      {/* ── Subscriptions horizontal scroll ─────────────────────────────── */}
      {subscriptions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Subscriptions</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {subscriptions.map((p) => (
              <button
                key={p._id}
                onClick={() => navigate(`/podcasts/${p._id}`)}
                className="flex-shrink-0 flex flex-col items-center gap-1.5 w-20"
              >
                {p.coverUrl
                  ? <img src={p.coverUrl} alt={p.title}
                      className="w-16 h-16 rounded-xl object-cover shadow" />
                  : <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shadow">
                      <BsMicFill size={20} className="text-primary" />
                    </div>
                }
                <p className="text-[10px] text-gray-600 text-center leading-tight line-clamp-2">{p.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Category filter pills ────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c
                ? 'bg-primary text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Popular grid ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Popular</h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : podcasts.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-gray-400">
            <BsMicFill size={36} />
            <p className="text-sm">No podcasts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {podcasts.map((p) => (
              <PodcastCard key={p._id} podcast={p} onClick={() => navigate(`/podcasts/${p._id}`)} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recently played ──────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recently Played</h2>
          <div className="space-y-2">
            {recent.slice(0, 5).map((ep, i) => (
              <div key={i}
                className="flex items-center gap-3 bg-white rounded-card shadow-card px-3 py-2.5">
                {ep.coverUrl
                  ? <img src={ep.coverUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BsMicFill size={14} className="text-primary" />
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ep.title}</p>
                  <p className="text-xs text-gray-400 truncate">{ep.podcastTitle}</p>
                </div>
                <FiPlay size={16} className="text-primary flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PodcastCard({ podcast: p, onClick }) {
  return (
    <button onClick={onClick} className="text-left bg-white rounded-card shadow-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-surface">
        {p.coverUrl
          ? <img src={p.coverUrl} alt={p.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <BsMicFill size={32} className="text-gray-300" />
            </div>
        }
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{p.title}</p>
        <p className="text-xs text-gray-400 mt-1 truncate">{p.author || p.hostName}</p>
        {p.category && (
          <span className="inline-block mt-1.5 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
            {p.category}
          </span>
        )}
      </div>
    </button>
  );
}
