import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Scale, X, ChevronDown, Flame } from 'lucide-react';
import Section, { SectionHeading, Reveal, CtaCard } from '../components/ui/Section';
import ChipToggle from '../components/ui/ChipToggle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import Badge, { FoodTypeMark } from '../components/ui/Badge';
import { ArticleSkeleton, TableSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { nutritionApi } from '../api/endpoints';
import { DIET_FILTERS } from '../lib/constants';
import { formatINR, cn } from '../lib/utils';

const ROWS = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbohydrates', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fibre', label: 'Fibre', unit: 'g' },
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
];

export default function Nutrition() {
  const [guide, setGuide] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ tags: [], foodType: 'all', maxCalories: '' });
  const [compareIds, setCompareIds] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    nutritionApi.guide().then((res) => setGuide(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    nutritionApi
      .table({
        tags: filters.tags.join(','),
        foodType: filters.foodType,
        ...(filters.maxCalories ? { maxCalories: filters.maxCalories } : {}),
      })
      .then((res) => !cancelled && setProducts(res.data))
      .catch(() => !cancelled && setProducts([]))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const compared = useMemo(
    () => products.filter((p) => compareIds.includes(p._id)),
    [products, compareIds]
  );

  const toggleCompare = (id) =>
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id]
    );

  const toggleTag = (key) =>
    setFilters((f) => ({ ...f, tags: f.tags.includes(key) ? f.tags.filter((t) => t !== key) : [...f.tags, key] }));

  if (!guide) return <ArticleSkeleton label="Loading the nutrition guide" />;

  return (
    <>
      <PageHeader
        eyebrow="Nutrition, in plain language"
        icon={Flame}
        title="Know exactly what you are eating"
        subtitle="Every snack on our menu carries its approximate calories, protein, carbohydrates, fat and fibre, plus key micronutrients. Here is what those numbers actually mean - no jargon, no health claims."
      />

      {/* --------------------------- Macro explainers -------------------------- */}
      <Section>
        <SectionHeading
          align="left"
          eyebrow="The basics"
          title="The five numbers on every card"
          subtitle="If you only remember two, make them protein and fibre - they are what keep you full."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {guide.macros.map((m, i) => (
            <Reveal key={m.key} delay={i * 0.05}>
              <article className="card h-full p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="h-card">{m.label}</h3>
                  <span className="text-xs font-bold uppercase tracking-wide text-brand-600">{m.unit}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-charcoal/80">{m.summary}</p>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{m.detail}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <h3 className="h-card mt-12">Micronutrients we track</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guide.micros.map((m) => (
            <div key={m.key} className="rounded-3xl border border-black/5 bg-white p-5">
              <h4 className="font-bold">
                {m.label} <span className="text-xs font-semibold text-charcoal/40">({m.unit})</span>
              </h4>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">{m.summary}</p>
              <p className="mt-2 text-xs text-charcoal/45">
                <strong className="font-semibold">Found in:</strong> {m.sources}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guide.badges.map((b) => (
            <div key={b.code} className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5">
              <Badge>{b.code}</Badge>
              <p className="text-xs leading-relaxed text-charcoal/60">{b.rule}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ------------------------- Filterable nutrition ------------------------ */}
      <section className="section bg-white" id="table">
        <div className="container">
          <SectionHeading
            align="left"
            eyebrow="Compare"
            title="Find the snack that fits your day"
            subtitle="Filter by what matters to you, then tick up to four snacks to compare them side by side."
          />

          <div className="mb-6 space-y-4 rounded-3xl border border-black/5 bg-cream p-5">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-charcoal/45">Nutrition filters</p>
              <div className="flex flex-wrap gap-2">
                {DIET_FILTERS.map((f) => (
                  <ChipToggle
                    key={f.key}
                    active={filters.tags.includes(f.key)}
                    onClick={() => toggleTag(f.key)}
                  >
                    {f.label}
                  </ChipToggle>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-charcoal/45">Diet</p>
                <div className="flex gap-2">
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'veg', label: 'Veg' },
                    { key: 'non-veg', label: 'Non-veg' },
                  ].map((o) => (
                    <ChipToggle
                      key={o.key}
                      active={filters.foodType === o.key}
                      onClick={() => setFilters((f) => ({ ...f, foodType: o.key }))}
                    >
                      {o.label}
                    </ChipToggle>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="maxCal" className="mb-2 block text-xs font-bold uppercase tracking-wide text-charcoal/45">
                  Max calories
                </label>
                <input
                  id="maxCal"
                  type="number"
                  min="100"
                  step="50"
                  placeholder="e.g. 300"
                  value={filters.maxCalories}
                  onChange={(e) => setFilters((f) => ({ ...f, maxCalories: e.target.value }))}
                  className="input w-36 py-2 text-sm"
                />
              </div>

              {(filters.tags.length > 0 || filters.foodType !== 'all' || filters.maxCalories) && (
                <button
                  onClick={() => setFilters({ tags: [], foodType: 'all', maxCalories: '' })}
                  className="pb-2 text-xs font-semibold text-charcoal/50 underline underline-offset-2 hover:text-charcoal"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={6} />
          ) : products.length === 0 ? (
            <EmptyState
              title="No snacks match those filters"
              description="Try relaxing the calorie limit or removing a nutrition filter."
              actionLabel="Reset filters"
              onAction={() => setFilters({ tags: [], foodType: 'all', maxCalories: '' })}
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-black/5">
              <div className="hidden grid-cols-[2.5fr_repeat(5,1fr)_auto] gap-2 bg-cream px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-charcoal/45 lg:grid">
                <span>Snack</span>
                <span className="text-center">Cal</span>
                <span className="text-center">Protein</span>
                <span className="text-center">Carbs</span>
                <span className="text-center">Fat</span>
                <span className="text-center">Fibre</span>
                <span className="text-center">Compare</span>
              </div>

              <ul className="divide-y divide-black/5 bg-white">
                {products.map((p) => (
                  <li key={p._id}>
                    <div className="grid grid-cols-1 items-center gap-3 px-4 py-3 lg:grid-cols-[2.5fr_repeat(5,1fr)_auto] lg:gap-2">
                      <div className="flex items-center gap-3">
                        <SmartImage src={p.images?.[0]?.url} alt="" width={120} wrapperClassName="h-12 w-12 shrink-0 rounded-xl" />
                        <div className="min-w-0">
                          <Link to={'/menu/' + p.slug} className="flex items-center gap-1.5 text-sm font-bold hover:text-brand-700">
                            <FoodTypeMark type={p.foodType} size={12} />
                            <span className="truncate">{p.name}</span>
                          </Link>
                          <p className="text-[11px] text-charcoal/45">
                            {p.category?.name} &middot; {formatINR(p.price)} &middot; {p.servingSize}
                          </p>
                        </div>
                        <button
                          onClick={() => setExpanded(expanded === p._id ? null : p._id)}
                          aria-label="Toggle nutrition details"
                          className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-black/5 lg:hidden"
                        >
                          <ChevronDown size={16} className={cn('transition', expanded === p._id && 'rotate-180')} />
                        </button>
                      </div>

                      <div
                        className={cn(
                          'col-span-1 grid grid-cols-5 gap-2 lg:col-span-5 lg:contents',
                          expanded === p._id ? 'grid' : 'hidden lg:contents'
                        )}
                      >
                        {['calories', 'protein', 'carbs', 'fat', 'fibre'].map((k) => (
                          <div key={k} className="text-center">
                            <span className="block text-sm font-extrabold">{Math.round(p.nutrition?.[k] || 0)}</span>
                            <span className="text-[10px] uppercase text-charcoal/40 lg:hidden">{k}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-center">
                        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold">
                          <input
                            type="checkbox"
                            checked={compareIds.includes(p._id)}
                            onChange={() => toggleCompare(p._id)}
                            disabled={!compareIds.includes(p._id) && compareIds.length >= 4}
                            className="h-4 w-4 rounded border-black/20 text-brand-600 focus:ring-brand-500"
                          />
                          <span className="lg:hidden">Compare</span>
                        </label>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              <strong>{guide.disclaimer}</strong> {guide.note}
            </span>
          </p>
        </div>
      </section>

      {/* ---------------------------- Compare drawer --------------------------- */}
      {compared.length > 0 && (
        <div className="sticky bottom-0 z-40 max-h-[55vh] overflow-y-auto border-t border-black/10 bg-white/95 backdrop-blur-xl">
          <div className="container py-4 pb-safe-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="h-card">
                <Scale size={17} className="text-brand-600" /> Comparing {compared.length} snacks
              </h3>
              <button onClick={() => setCompareIds([])} className="chip-neutral transition hover:bg-black/10">
                Clear <X size={12} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr>
                    <th className="w-32 pb-2 text-left text-[11px] font-bold uppercase tracking-wide text-charcoal/40">
                      Per serving
                    </th>
                    {compared.map((p) => (
                      <th key={p._id} className="pb-2 text-left">
                        <span className="flex items-center gap-1.5 text-xs font-bold">
                          <FoodTypeMark type={p.foodType} size={11} />
                          <span className="truncate">{p.name}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-brand-700">{formatINR(p.price)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {ROWS.map((row) => (
                    <tr key={row.key}>
                      <td className="py-1.5 text-xs font-semibold text-charcoal/55">
                        {row.label} <span className="text-charcoal/35">({row.unit})</span>
                      </td>
                      {compared.map((p) => (
                        <td key={p._id} className="py-1.5 font-bold">
                          {Math.round(p.nutrition?.[row.key] || 0)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Section pad="flush-top">
        <CtaCard
          title="Found your macros? Let us make it fresh."
          actions={
            <Button to="/menu" variant="accent" size="lg">
              ORDER NOW
            </Button>
          }
        >
          Order individual snacks whenever you like, from {formatINR(100)}. No plans, no subscription.
        </CtaCard>
      </Section>
    </>
  );
}
