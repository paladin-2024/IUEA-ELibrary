import { useState }         from 'react';
import { useParams }        from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Pause, Bell, BellOff, Mic2 }      from 'lucide-react';
import { getPodcast, toggleSubscribe } from '../../services/podcast.service';
import LoadingSpinner   from '../../components/ui/LoadingSpinner';
import useAuthStore     from '../../store/authStore';
import toast            from 'react-hot-toast';

export default function PodcastPage() {
  const { id }   = useParams();
  const { user } = useAuthStore();
  const qc       = useQueryClient();
  const [playing, setPlaying] = useState(null);
  const [audio,   setAudio]   = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['podcast', id],
    queryFn:  () => getPodcast(id),
  });

  const { mutate: subscribe, isPending: subscribing } = useMutation({
    mutationFn: () => toggleSubscribe(id),
    onSuccess:  (res) => {
      toast.success(res.subscribed ? 'Subscribed!' : 'Unsubscribed.');
      qc.invalidateQueries(['podcast', id]);
    },
    onError: () => toast.error('Login required to subscribe.'),
  });

  const playEpisode = (ep) => {
    if (audio) { audio.pause(); setAudio(null); }
    if (playing === ep._id) { setPlaying(null); return; }
    const a = new Audio(ep.audioUrl);
    a.play();
    a.onended = () => setPlaying(null);
    setAudio(a);
    setPlaying(ep._id);
  };

  if (isLoading) return <LoadingSpinner className="min-h-[60vh]" />;
  const { podcast } = data;

  const isSubscribed = user && podcast.subscribers?.some?.((s) =>
    typeof s === 'string' ? s === user._id : s._id === user._id
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex gap-6 mb-8">
        <div className="w-28 h-28 shrink-0 bg-primary/10 rounded-card overflow-hidden">
          {podcast.coverUrl ? (
            <img src={podcast.coverUrl} alt={podcast.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><Mic2 size={32} className="text-primary/30" /></div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-serif text-2xl font-semibold text-gray-800">{podcast.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{podcast.author}</p>
          {podcast.description && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{podcast.description}</p>}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-gray-400">{podcast.episodes?.length} episodes</span>
            {user && (
              <button
                onClick={() => subscribe()}
                disabled={subscribing}
                className="flex items-center gap-1.5 text-xs border border-primary text-primary px-3 py-1.5 rounded-btn hover:bg-primary/5 transition-colors"
              >
                {isSubscribed ? <><BellOff size={12} /> Unsubscribe</> : <><Bell size={12} /> Subscribe</>}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Episodes */}
      <h2 className="font-semibold text-gray-700 mb-3">Episodes</h2>
      <div className="space-y-2">
        {podcast.episodes?.map((ep, i) => (
          <div key={ep._id || i} className="flex items-center gap-3 bg-white rounded-card p-3 shadow-card">
            <button
              onClick={() => playEpisode(ep)}
              className="shrink-0 w-9 h-9 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors"
            >
              {playing === ep._id ? <Pause size={14} /> : <Play size={14} fill="white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 line-clamp-1">{ep.title}</p>
              {ep.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{ep.description}</p>}
            </div>
            {ep.duration > 0 && (
              <span className="text-xs text-gray-400 shrink-0">
                {Math.floor(ep.duration / 60)}:{String(ep.duration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
