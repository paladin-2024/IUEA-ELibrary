/**
 * SkeletonCard — shimmer placeholder matching BookCard proportions.
 * Uses Tailwind's animate-pulse; for the moving-shimmer variant
 * add the 'shimmer' keyframe to tailwind.config.js:
 *
 *   animation: { shimmer: 'shimmer 1.5s infinite' },
 *   keyframes: {
 *     shimmer: {
 *       from: { backgroundPosition: '200% 0' },
 *       to:   { backgroundPosition: '-200% 0' },
 *     },
 *   },
 */
export default function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`flex-shrink-0 w-[140px] select-none ${className}`}
      aria-hidden="true"
    >
      {/* Cover placeholder */}
      <div
        className={[
          'aspect-[2/3] rounded-[12px] overflow-hidden',
          'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100',
          'bg-[length:200%_100%]',
          'animate-[shimmer_1.5s_infinite]',
        ].join(' ')}
      />

      {/* Metadata placeholders */}
      <div className="mt-[8px] px-[2px] space-y-[6px]">
        <div className="h-[12px] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[85%]" />
        <div className="h-[10px] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[60%]" />
        <div className="h-[6px]  bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-full mt-[8px]" />
      </div>
    </div>
  );
}

/** Grid variant — full-width, matches grid BookCard */
export function SkeletonCardGrid({ className = '' }) {
  return (
    <div className={`w-full select-none ${className}`} aria-hidden="true">
      <div className="aspect-[2/3] rounded-[12px] overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />
      <div className="mt-[8px] space-y-[6px]">
        <div className="h-[12px] bg-gray-200 rounded-full w-4/5 animate-pulse" />
        <div className="h-[10px] bg-gray-100 rounded-full w-3/5 animate-pulse" />
      </div>
    </div>
  );
}
