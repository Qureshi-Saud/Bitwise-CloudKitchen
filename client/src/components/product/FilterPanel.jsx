import { X, RotateCcw } from 'lucide-react';
import { DIET_FILTERS, PRICE_BANDS } from '../../lib/constants';
import ChipToggle from '../ui/ChipToggle';
import { IconButton } from '../ui/Button';

const Group = ({ title, children }) => (
  <div className="border-b border-black/5 py-5 first:pt-0 last:border-0">
    <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-charcoal/45">{title}</h4>
    {children}
  </div>
);

/**
 * Every control here maps to a real backend query parameter, so filtering is
 * genuinely server-side rather than a cosmetic client-side pass.
 */
export default function FilterPanel({ categories = [], filters, onChange, onReset, onClose, resultCount }) {
  const toggleArray = (key, value) => {
    const current = filters[key] || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next, page: 1 });
  };

  const setValue = (key, value) =>
    onChange({ ...filters, [key]: filters[key] === value ? undefined : value, page: 1 });

  const activeCount =
    (filters.categories?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.foodType && filters.foodType !== 'all' ? 1 : 0) +
    (filters.priceBand ? 1 : 0);

  return (
    <aside className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 pb-4">
        <div>
          <h3 className="h-card">Filters</h3>
          {resultCount !== undefined && (
            <p className="text-xs text-charcoal/50">{resultCount} snacks match</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {activeCount > 0 && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-charcoal/60 transition hover:bg-black/5"
            >
              <RotateCcw size={13} /> Reset
            </button>
          )}
          {onClose && (
            <IconButton icon={X} label="Close filters" onClick={onClose} className="lg:hidden" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <Group title="Category">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <ChipToggle
                key={c._id}
                active={filters.categories?.includes(c.slug)}
                onClick={() => toggleArray('categories', c.slug)}
              >
                {c.name}
                <span className="opacity-60">{c.productCount}</span>
              </ChipToggle>
            ))}
          </div>
        </Group>

        <Group title="Vegetarian / Non-vegetarian">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'veg', label: 'Vegetarian' },
              { key: 'non-veg', label: 'Non-vegetarian' },
            ].map((o) => (
              <ChipToggle
                key={o.key}
                active={(filters.foodType || 'all') === o.key}
                onClick={() => onChange({ ...filters, foodType: o.key, page: 1 })}
              >
                {o.label}
              </ChipToggle>
            ))}
          </div>
        </Group>

        <Group title="Nutrition & preparation">
          <div className="flex flex-wrap gap-2">
            {DIET_FILTERS.map((f) => (
              <ChipToggle key={f.key} active={filters.tags?.includes(f.key)} onClick={() => toggleArray('tags', f.key)}>
                {f.label}
              </ChipToggle>
            ))}
          </div>
        </Group>

        <Group title="Price range">
          <div className="flex flex-wrap gap-2">
            {PRICE_BANDS.map((b) => (
              <ChipToggle key={b.key} active={filters.priceBand === b.key} onClick={() => setValue('priceBand', b.key)}>
                {b.label}
              </ChipToggle>
            ))}
          </div>
        </Group>
      </div>
    </aside>
  );
}
