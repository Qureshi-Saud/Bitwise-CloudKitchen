import { cn } from '../../lib/utils';

const ITEMS = [
  { key: 'calories', label: 'Cal', unit: '', accent: 'text-charcoal' },
  { key: 'protein', label: 'Protein', unit: 'g', accent: 'text-brand-700' },
  { key: 'carbs', label: 'Carbs', unit: 'g', accent: 'text-charcoal' },
  { key: 'fat', label: 'Fat', unit: 'g', accent: 'text-charcoal' },
  { key: 'fibre', label: 'Fibre', unit: 'g', accent: 'text-violet-700' },
];

/** The compact per-serving macro row that appears on every product card. */
export default function NutritionStrip({ nutrition = {}, className, compact = false }) {
  return (
    <div
      className={cn(
        'grid grid-cols-5 divide-x divide-black/5 rounded-2xl bg-cream/80 ring-1 ring-black/5',
        compact ? 'py-1.5' : 'py-2.5',
        className
      )}
    >
      {ITEMS.map((item) => (
        <div key={item.key} className="px-1 text-center">
          <p className={cn('font-extrabold leading-none', compact ? 'text-[13px]' : 'text-sm', item.accent)}>
            {Math.round(Number(nutrition[item.key]) || 0)}
            {item.unit}
          </p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-charcoal/45">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
