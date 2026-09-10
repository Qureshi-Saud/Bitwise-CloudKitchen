import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Lazy-loaded image with a shimmer placeholder and a graceful fallback.
 * Unsplash URLs are re-requested at the width we actually render, which keeps
 * the menu grid light on mobile connections.
 */
export default function SmartImage({ src, alt = '', className, wrapperClassName, width, eager = false }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const optimised =
    src && width && src.includes('images.unsplash.com')
      ? src.replace(/([?&])w=\d+/, '$1w=' + width)
      : src;

  return (
    <div className={cn('relative overflow-hidden bg-black/[.04]', wrapperClassName)}>
      {!loaded && !failed && <div className="skeleton absolute inset-0 rounded-none" />}
      {failed || !src ? (
        <div className="grid h-full w-full place-items-center text-charcoal/25">
          <ImageOff size={28} />
        </div>
      ) : (
        <img
          src={optimised}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            className
          )}
        />
      )}
    </div>
  );
}
