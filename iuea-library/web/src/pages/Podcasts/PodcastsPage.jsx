import { useState }    from 'react';
import { Link }        from 'react-router-dom';
import { useQuery }    from '@tanstack/react-query';
import { Mic2, Play }  from 'lucide-react';
import { listPodcasts } from '../../services/podcast.service';
import LoadingSpinner   from '../../components/ui/LoadingSpinner';
import EmptyState       from '../../components/ui/EmptyState';

export default function PodcastsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['podcasts', page],
    queryFn:  () => listPodcasts({ page, limit: 20 }),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Mic2 size={24} className="text-primary" />
        <h1 className="font-serif text-2xl font-semibold text-primary">Podcasts</h1>
      </div>

      {isLoading ? (
        <LoadingSpinner className="min-h-[40vh]" />
      ) : !data?.podcasts?.length ? (
        <EmptyState title="No podcasts available" message="Check back soon." icon={Mic2} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {data.podcasts.map((podcast) => (
              <Link
                key={podcast._id}
                to={`/podcasts/${podcast._id}`}
                className="group bg-white rounded-card shadow-card hover:shadow-btn transition-shadow overflow-hidden"
              >
                <div className="relative aspect-square bg-primary/10">
                  {podcast.coverUrl ? (
                    <img src={podcast.coverUrl} alt={podcast.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Mic2 size={40} className="text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play size={32} className="text-white" fill="white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">{podcast.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{podcast.author}</p>
                  <p className="text-xs text-primary mt-1">{podcast.episodes?.length || 0} episodes</p>
                </div>
              </Link>
            ))}
          </div>

          {data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-btn border text-sm disabled:opacity-40">← Prev</button>
              <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {data.pages}</span>
              <button onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages} className="px-4 py-2 rounded-btn border text-sm disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
