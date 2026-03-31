import { useState, useEffect }        from 'react';
import { useParams, useNavigate }     from 'react-router-dom';
import { BsMicFill }                  from 'react-icons/bs';
import { FiPlay, FiDownload, FiArrowLeft, FiCheck } from 'react-icons/fi';
import api                             from '../../services/api';

function fmtDuration(secs) {
  if (!secs) return '--:--';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function PodcastDetailPage() {
  const { id }                          = useParams();
  const navigate                        = useNavigate();
  const [podcast, setPodcast]           = useState(null);
  const [subscribed, setSubscribed]     = useState(false);
  const [subLoading, setSubLoading]     = useState(false);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/podcasts/${id}`),
      api.get('/podcasts/subscriptions').catch(() => ({ data: { podcasts: [] } })),
    ]).then(([pd, subs]) => {
      const p = pd.data.podcast;
      setPodcast(p);
      const subIds = (subs.data.podcasts ?? []).map((s) => s._id);
      setSubscribed(subIds.includes(p._id));
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleSubscribe = async () => {
    setSubLoading(true);
    try {
      if (subscribed) {
        await api.delete(`/podcasts/subscribe/${id}`);
        setSubscribed(false);
      } else {
        await api.post(`/podcasts/subscribe/${id}`);
        setSubscribed(true);
      }
    } catch { /* ignore */ }
    setSubLoading(false);
  };

  const playEpisode = (ep) => {
    navigate(`/podcasts/${id}/play`, {
      state: {
        episode:      ep,
        podcastTitle: podcast?.title,
        coverUrl:     podcast?.coverUrl,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="text-center py-16 text-gray-500">Podcast not found.</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ── Back ──────────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-5 transition-colors"
      >
        <FiArrowLeft size={16} /> Back
      </button>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex gap-4 mb-5">
        {podcast.coverUrl
          ? <img src={podcast.coverUrl} alt={podcast.title}
              className="w-28 h-28 rounded-xl object-cover shadow-card flex-shrink-0" />
          : <div className="w-28 h-28 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BsMicFill size={40} className="text-primary" />
            </div>
        }
        <div className="flex-1 min-w-0">
          <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
            {podcast.category}
          </p>
          <h1 className="font-serif text-xl font-bold text-gray-900 leading-tight">
            {podcast.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {podcast.author || podcast.hostName}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {podcast.episodes?.length ?? 0} episodes ·{' '}
            {podcast.subscriberCount ?? 0} subscribers
          </p>
        </div>
      </div>

      {/* Description */}
      {podcast.description && (
        <p className="text-sm text-gray-600 leading-relaxed mb-5 line-clamp-3">
          {podcast.description}
        </p>
      )}

      {/* ── Subscribe button ──────────────────────────────────────────────── */}
      <button
        onClick={toggleSubscribe}
        disabled={subLoading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-btn text-sm font-semibold transition-colors mb-6 ${
          subscribed
            ? 'bg-primary/10 text-primary border border-primary hover:bg-primary/20'
            : 'bg-primary text-white hover:bg-primary-dark'
        } disabled:opacity-60`}
      >
        {subscribed && <FiCheck size={15} />}
        {subLoading ? 'Updating…' : subscribed ? 'Subscribed' : 'Subscribe'}
      </button>

      {/* ── Episodes list ─────────────────────────────────────────────────── */}
      <h2 className="font-semibold text-gray-800 mb-3">
        Episodes <span className="text-sm font-normal text-gray-400">({podcast.episodes?.length ?? 0})</span>
      </h2>

      {(podcast.episodes?.length ?? 0) === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No episodes yet.</p>
      ) : (
        <div className="space-y-2">
          {podcast.episodes.map((ep) => (
            <div key={ep._id}
              className="flex items-center gap-3 bg-white rounded-card shadow-card px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                  {ep.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ep.publishDate
                    ? new Date(ep.publishDate).toLocaleDateString()
                    : ''
                  }
                  {ep.publishDate && ep.duration ? ' · ' : ''}
                  {fmtDuration(ep.duration)}
                </p>
              </div>

              {/* Play */}
              <button
                onClick={() => playEpisode(ep)}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary-dark transition-colors"
                title="Play"
              >
                <FiPlay size={14} className="text-white ml-0.5" />
              </button>

              {/* Download (UI only) */}
              <button
                className="flex-shrink-0 w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-primary hover:text-primary transition-colors text-gray-400"
                title="Download"
              >
                <FiDownload size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
