import { cn } from '../../lib/utils';

const TONES = {
  green: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  orange: 'bg-carrot-50 text-carrot-700 ring-1 ring-carrot-200',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  slate: 'bg-black/5 text-charcoal/70 ring-1 ring-black/5',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

/** Maps a product badge string to a consistent colour across the whole site. */
const badgeTone = (label = '') => {
  const l = label.toUpperCase();
  if (l.includes('PROTEIN')) return 'green';
  if (l.includes('FIBRE') || l.includes('FIBER')) return 'violet';
  if (l.includes('OIL')) return 'amber';
  if (l.includes('GRAIN') || l.includes('OATS') || l.includes('MILLET')) return 'orange';
  if (l.includes('KCAL') || l.includes('SUGAR')) return 'slate';
  return 'slate';
};

export default function Badge({ children, tone, className }) {
  const resolved = tone || badgeTone(String(children));
  return <span className={cn('chip', TONES[resolved] || TONES.slate, className)}>{children}</span>;
}

/** The green square / red square vegetarian indicator used across Indian menus. */
export function FoodTypeMark({ type = 'veg', size = 16, showLabel = false, className }) {
  const isVeg = type === 'veg';
  const color = isVeg ? '#16a34a' : '#b91c1c';
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span
        className="grid place-items-center rounded-[3px] border-[1.5px]"
        style={{ width: size, height: size, borderColor: color }}
        aria-hidden="true"
      >
        <span className="block rounded-full" style={{ width: size * 0.45, height: size * 0.45, background: color }} />
      </span>
      <span className="sr-only">{isVeg ? 'Vegetarian' : 'Non-vegetarian'}</span>
      {showLabel && (
        <span className="text-xs font-semibold" style={{ color }}>
          {isVeg ? 'Veg' : 'Non-veg'}
        </span>
      )}
    </span>
  );
}
