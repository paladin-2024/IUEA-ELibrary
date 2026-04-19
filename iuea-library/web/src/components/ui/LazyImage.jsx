import { useState } from 'react';
import { cn }       from '../../utils/cn';

/**
 * LazyImage — img with loading="lazy", a blur-in fade, and a fallback
 * placeholder while the image loads or if it fails.
 */
export default function LazyImage({
  src,
  alt       = '',
  className = '',
  fallback  = null,
  ...props
}) {
  const [status, setStatus] = useState('loading'); // loading | loaded | error

  return (
    <div className={cn('relative overflow-hidden bg-gray-100', className)}>
      {src && status !== 'error' && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            status === 'loaded' ? 'opacity-100' : 'opacity-0',
          )}
          {...props}
        />
      )}

      {/* Placeholder shown while loading or on error */}
      {(status !== 'loaded' || !src) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {fallback ?? (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
}
