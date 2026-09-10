import { useEffect, useMemo, useState } from 'react';
import { Plus, ShoppingCart, Info, PackageCheck, Sparkles } from 'lucide-react';
import Section from '../components/ui/Section';
import QuantityStepper from '../components/ui/QuantityStepper';
import ChipToggle from '../components/ui/ChipToggle';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import Badge, { FoodTypeMark } from '../components/ui/Badge';
import NutritionStrip from '../components/product/NutritionStrip';
import Skeleton, { BuilderSkeleton } from '../components/ui/Skeleton';
import { snackBoxApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatINR, cn } from '../lib/utils';
import { NUTRITION_DISCLAIMER } from '../lib/constants';

export default function SnackBox() {
  const [config, setConfig] = useState(null);
  const [selection, setSelection] = useState({});
  const [extras, setExtras] = useState([]);
  const [boxQuantity, setBoxQuantity] = useState(1);
  const [summary, setSummary] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    snackBoxApi
      .config()
      .then((res) => {
        setConfig(res.data);
        setActiveCategory(res.data.categories?.[0]?.slug || null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const itemCount = useMemo(() => Object.values(selection).reduce((s, q) => s + q, 0), [selection]);

  const boxItems = useMemo(
    () => Object.entries(selection).filter(([, q]) => q > 0).map(([productId, quantity]) => ({ productId, quantity })),
    [selection]
  );

  // The box price always comes from the server so extras and tier savings are trustworthy.
  useEffect(() => {
    if (!config) return undefined;
    if (itemCount < config.minItems) {
      setSummary(null);
      setError(null);
      return undefined;
    }

    let cancelled = false;
    setQuoting(true);

    const timer = setTimeout(() => {
      snackBoxApi
        .quote({ boxItems, extras, quantity: boxQuantity })
        .then((res) => {
          if (!cancelled) {
            setSummary(res.data);
            setError(null);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setSummary(null);
            setError(err.message);
          }
        })
        .finally(() => !cancelled && setQuoting(false));
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [config, boxItems, extras, boxQuantity, itemCount]);

  if (!config) return <BuilderSkeleton label="Setting up your snack box" />;

  const setQty = (productId, delta) =>
    setSelection((prev) => {
      const next = Math.max((prev[productId] || 0) + delta, 0);
      if (next === 0) {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }
      if (delta > 0 && itemCount >= config.maxItems) {
        toast.info('A snack box can hold up to ' + config.maxItems + ' items');
        return prev;
      }
      return { ...prev, [productId]: Math.min(next, 10) };
    });

  const toggleExtra = (key) =>
    setExtras((prev) => (prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]));

  const addBoxToCart = () => {
    addItem({
      kind: 'snackbox',
      quantity: boxQuantity,
      boxItems,
      extras,
      meta: { name: 'Custom Snack Box (' + itemCount + ' items)' },
    });
    toast.success('Your one-time snack box is in the cart');
    setSelection({});
    setExtras([]);
    setBoxQuantity(1);
  };

  const activeCategoryData = config.categories.find((c) => c.slug === activeCategory) || config.categories[0];
  const progress = Math.min((itemCount / config.minItems) * 100, 100);

  return (
    <>
      <PageHeader
        tone="dark"
        eyebrow="One-time box &middot; Not a subscription"
        icon={PackageCheck}
        title={config.title}
        subtitle={config.subtitle}
      >
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/70">
          <span>Pick {config.minItems} to {config.maxItems} snacks</span>
          <span>Add optional extras</span>
          <span>See the full summary before it reaches your cart</span>
        </div>
      </PageHeader>

      <Section pad="tight">
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4">
              {config.categories.map((c) => (
                <ChipToggle
                  key={c.slug}
                  active={activeCategory === c.slug}
                  onClick={() => setActiveCategory(c.slug)}
                >
                  {c.name}
                  <span className="opacity-60">{c.products.length}</span>
                </ChipToggle>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {activeCategoryData?.products.map((p) => {
                const qty = selection[p._id] || 0;
                return (
                  <article
                    key={p._id}
                    className={cn(
                      'flex gap-2.5 rounded-3xl border bg-white p-2.5 transition xs:gap-3 xs:p-3',
                      qty > 0 ? 'border-brand-500 ring-1 ring-brand-200' : 'border-black/5'
                    )}
                  >
                    <SmartImage
                      src={p.images?.[0]?.url}
                      alt={p.name}
                      width={200}
                      wrapperClassName="h-20 w-20 shrink-0 rounded-2xl xs:h-24 xs:w-24"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-sm font-bold">
                          <FoodTypeMark type={p.foodType} size={12} />
                          <span className="truncate">{p.name}</span>
                        </p>
                        <span className="shrink-0 text-sm font-extrabold text-brand-700">{formatINR(p.price)}</span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-charcoal/55">{p.shortDescription}</p>

                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {(p.badges || []).slice(0, 2).map((b) => (
                          <Badge key={b} className="!px-2 !py-0.5 !text-[10px]">{b}</Badge>
                        ))}
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="text-[11px] text-charcoal/45">
                          {Math.round(p.nutrition?.calories || 0)} kcal &middot; {Math.round(p.nutrition?.protein || 0)}g protein
                        </span>
                        {qty === 0 ? (
                          <button
                            onClick={() => setQty(p._id, 1)}
                            className="chip bg-brand-600 text-white transition hover:bg-brand-700"
                          >
                            <Plus size={12} /> Add
                          </button>
                        ) : (
                          <QuantityStepper
                            size="sm"
                            value={qty}
                            onChange={(next) => setQty(p._id, next - qty)}
                            min={0}
                            label={'quantity of ' + p.name}
                          />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-10">
              <h2 className="h-card">Optional extras</h2>
              <p className="mt-1 text-sm text-charcoal/55">Add a little something on top. All optional, all one-time.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {config.extras.map((e) => {
                  const active = extras.includes(e.key);
                  return (
                    <button
                      key={e.key}
                      onClick={() => toggleExtra(e.key)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition',
                        active ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-200' : 'border-black/10 bg-white hover:border-brand-300'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border-2 transition',
                            active ? 'border-brand-600 bg-brand-600' : 'border-black/20'
                          )}
                        >
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="font-medium">{e.label}</span>
                      </span>
                      <span className="shrink-0 text-xs font-bold text-carrot-600">+{formatINR(e.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ------------------------- Live box summary ------------------------ */}
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <div className="card overflow-hidden">
              <div className="border-b border-black/5 bg-cream px-5 py-4">
                <h2 className="h-card">Your Box Summary</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-carrot-600">
                  <Sparkles size={12} /> One-time order &middot; no auto-renewal
                </p>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span className="text-charcoal/60">
                      {itemCount} of {config.minItems} minimum
                    </span>
                    <span className="text-charcoal/40">max {config.maxItems}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/[.07]">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all duration-500"
                      style={{ width: progress + '%' }}
                    />
                  </div>
                </div>

                {itemCount === 0 ? (
                  <p className="py-8 text-center text-sm text-charcoal/50">
                    Add at least {config.minItems} snacks to see your box price.
                  </p>
                ) : (
                  <>
                    <ul className="space-y-2 border-b border-black/5 pb-4 text-sm">
                      {(summary?.items || boxItems).map((item) => (
                        <li key={item.product || item.productId} className="flex justify-between gap-2">
                          <span className="min-w-0 truncate text-charcoal/70">
                            {item.quantity}x {item.name || 'Selected snack'}
                          </span>
                          {item.price && (
                            <span className="shrink-0 font-semibold">{formatINR(item.price * item.quantity)}</span>
                          )}
                        </li>
                      ))}
                      {(summary?.extras || []).map((e) => (
                        <li key={e.label} className="flex justify-between gap-2 text-carrot-700">
                          <span className="truncate">+ {e.label}</span>
                          <span className="shrink-0 font-semibold">{formatINR(e.price)}</span>
                        </li>
                      ))}
                    </ul>

                    {error && (
                      <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">{error}</p>
                    )}

                    {summary && (
                      <>
                        <dl className="mt-4 space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-charcoal/60">Items subtotal</dt>
                            <dd className="font-semibold">{formatINR(summary.itemsSubtotal)}</dd>
                          </div>
                          {summary.savings > 0 && (
                            <div className="flex justify-between text-brand-700">
                              <dt>Box saving</dt>
                              <dd className="font-semibold">-{formatINR(summary.savings)}</dd>
                            </div>
                          )}
                          {summary.packagingFee > 0 && (
                            <div className="flex justify-between">
                              <dt className="text-charcoal/60">Packaging</dt>
                              <dd className="font-semibold">{formatINR(summary.packagingFee)}</dd>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-black/5 pt-2.5 text-base">
                            <dt className="font-bold">Box total</dt>
                            <dd className="font-extrabold text-brand-700">
                              {quoting ? <Skeleton className="h-5 w-20" /> : formatINR(summary.total)}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4">
                          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-charcoal/45">
                            Approximate nutrition per box
                          </p>
                          <NutritionStrip nutrition={summary.nutrition} compact />
                          <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-charcoal/40">
                            <Info size={11} className="mt-px shrink-0" />
                            {NUTRITION_DISCLAIMER}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-2xl bg-cream px-3 py-2">
                          <span className="text-sm font-semibold">Number of boxes</span>
                          <QuantityStepper
                            size="sm"
                            solid
                            value={boxQuantity}
                            onChange={setBoxQuantity}
                            min={1}
                            max={10}
                            label="number of boxes"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                <Button
                  onClick={addBoxToCart}
                  icon={ShoppingCart}
                  size="lg"
                  disabled={!summary || quoting || Boolean(error)}
                  className="mt-5 w-full"
                >
                  Add Box to Cart
                </Button>

                <p className="mt-3 text-center text-[11px] leading-relaxed text-charcoal/45">
                  This is a single, one-time snack box. There is no plan, no weekly commitment and nothing renews
                  automatically.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
