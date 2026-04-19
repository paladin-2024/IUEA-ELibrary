import { FiPlay, FiClock } from 'react-icons/fi';
import { cn }              from '../../utils/cn';

function formatDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * EpisodeCard — row-style card for a single podcast episode.
 *
 * Props:
 *   episode   — { _id, title, description, duration, publishedAt, number }
 *   onClick   — () => void
 *   isPlaying — bool
 *   className
 */
export default function EpisodeCard({
  episode,
  onClick,
  isPlaying = false,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-card bg-white border border-gray-100 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer group',
        isPlaying && 'border-primary/30 bg-primary/5',
        className,
      )}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Play button */}
      <button
        className={cn(
          'shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors',
          isPlaying
            ? 'bg-primary text-white'
            : 'bg-gray-100 text-gray-600 group-hover:bg-primary group-hover:text-white',
        )}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      >
        <FiPlay size={14} />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {episode.number && (
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
            Ep. {episode.number}
          </p>
        )}
        <p className={cn(
          'text-sm font-medium line-clamp-1 leading-snug',
          isPlaying ? 'text-primary' : 'text-gray-900',
        )}>
          {episode.title}
        </p>
        {episode.description && (
          <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
            {episode.description}
          </p>
        )}
      </div>

      {/* Duration */}
      {episode.duration && (
        <div className="shrink-0 flex items-center gap-1 text-[11px] text-gray-400">
          <FiClock size={11} />
          {formatDuration(episode.duration)}
        </div>
      )}
    </div>
  );
}
