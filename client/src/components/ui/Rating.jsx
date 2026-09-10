import { Star } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Rating({ value = 0, count, size = 14, className, showValue = true }) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <Star size={size} className="fill-amber-400 text-amber-400" />
      {showValue && <span className="text-xs font-bold">{Number(value).toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-charcoal/50">({count})</span>}
    </span>
  );
}

/** Interactive 1-5 star picker used in the review form. */
export function StarPicker({ value = 0, onChange, size = 28 }) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={n + ' star' + (n > 1 ? 's' : '')}
          onClick={() => onChange(n)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={size}
            className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-black/20'}
          />
        </button>
      ))}
    </div>
  );
}
