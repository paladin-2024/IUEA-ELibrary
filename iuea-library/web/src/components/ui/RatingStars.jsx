import { FiStar } from 'react-icons/fi';
import { cn }      from '../../utils/cn';

/**
 * RatingStars — read-only star rating display.
 *
 * Props:
 *   rating   — number 0–5 (supports half stars)
 *   count    — optional review count to show next to stars
 *   size     — 'sm' | 'md' | 'lg'
 *   className
 */
export default function RatingStars({
  rating    = 0,
  count     = null,
  size      = 'md',
  className = '',
}) {
  const starSize = size === 'sm' ? 12 : size === 'lg' ? 20 : 16;
  const clamped  = Math.min(5, Math.max(0, rating));

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = clamped >= star;
          const half   = !filled && clamped >= star - 0.5;
          return (
            <span key={star} className="relative inline-block" style={{ width: starSize, height: starSize }}>
              {/* Empty star */}
              <FiStar
                size={starSize}
                className="text-gray-300 absolute inset-0"
                fill="currentColor"
              />
              {/* Filled portion */}
              {(filled || half) && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? '50%' : '100%' }}
                >
                  <FiStar size={starSize} className="text-amber-400" fill="currentColor" />
                </span>
              )}
            </span>
          );
        })}
      </div>

      {count !== null && (
        <span className={cn(
          'text-gray-500',
          size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-sm' : 'text-xs',
        )}>
          ({count.toLocaleString()})
        </span>
      )}
    </div>
  );
}
