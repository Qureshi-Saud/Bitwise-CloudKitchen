import { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Info } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import QuantityStepper from '../ui/QuantityStepper';
import SmartImage from '../ui/SmartImage';
import Badge, { FoodTypeMark } from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import NutritionStrip from './NutritionStrip';
import { catalogueApi } from '../../api/endpoints';
import { formatINR, cn } from '../../lib/utils';
import { NUTRITION_DISCLAIMER } from '../../lib/constants';

/** Pre-selects whatever the admin marked as the default option in each group. */
const buildDefaults = (product) =>
  (product?.optionGroups || []).map((g) => ({
    groupKey: g.key,
    optionIds: g.options.filter((o) => o.isDefault).map((o) => o._id),
  }));

export default function CustomizeDialog({ product, open, onClose, onAddToCart }) {
  const [selections, setSelections] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && product) {
      setSelections(buildDefaults(product));
      setQuantity(1);
      setError(null);
    }
  }, [open, product]);

  // Price and nutrition are always recomputed by the server, never in the browser.
  useEffect(() => {
    if (!open || !product) return undefined;
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      catalogueApi
        .customizePreview(product._id, { customizations: selections, quantity })
        .then((res) => { if (!cancelled) { setPreview(res.data); setError(null); } })
        .catch((err) => { if (!cancelled) setError(err.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 180);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [open, product, selections, quantity]);

  const selectedFor = (key) => selections.find((s) => s.groupKey === key)?.optionIds || [];

  const toggle = (group, optionId) => {
    setSelections((prev) => {
      const others = prev.filter((s) => s.groupKey !== group.key);
      const current = prev.find((s) => s.groupKey === group.key)?.optionIds || [];

      let next;
      if (group.type === 'single') {
        next = current.includes(optionId) && !group.required ? [] : [optionId];
      } else if (current.includes(optionId)) {
        next = current.filter((id) => id !== optionId);
      } else {
        next = current.length >= group.maxSelect ? current : [...current, optionId];
      }
      return [...others, { groupKey: group.key, optionIds: next }];
    });
  };

  const groups = useMemo(
    () => [...(product?.optionGroups || [])].sort((a, b) => a.order - b.order),
    [product]
  );

  if (!product) return null;

  const handleAdd = () => {
    onAddToCart({
      kind: 'product',
      productId: product._id,
      quantity,
      customizations: selections.filter((s) => s.optionIds.length),
      meta: { name: product.name, image: product.images?.[0]?.url },
    });
    onClose();
  };

  const footer = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <QuantityStepper solid value={quantity} onChange={setQuantity} min={1} max={20} />
        <div>
          <p className="flex items-center text-xl font-extrabold text-brand-700">
            {loading
              ? <Skeleton className="h-6 w-24" />
              : formatINR(preview?.lineTotal ?? product.price * quantity)}
          </p>
          {preview?.customizationPrice > 0 && (
            <p className="text-[11px] text-charcoal/50">
              includes {formatINR(preview.customizationPrice)} customization
            </p>
          )}
        </div>
      </div>
      <Button icon={ShoppingCart} size="lg" onClick={handleAdd} disabled={Boolean(error)} className="w-full sm:w-auto">
        Add to Cart
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={'Customize ' + product.name}
      description="Change anything you like - the price and nutrition update instantly."
      footer={footer}
    >
      <div className="mb-5 flex gap-4 rounded-2xl bg-cream p-3">
        <SmartImage
          src={product.images?.[0]?.url}
          alt={product.name}
          width={240}
          wrapperClassName="h-24 w-24 shrink-0 rounded-2xl"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FoodTypeMark type={product.foodType} size={14} />
            <h4 className="truncate font-bold">{product.name}</h4>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-charcoal/60">{product.shortDescription}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(product.badges || []).slice(0, 3).map((b) => <Badge key={b}>{b}</Badge>)}
          </div>
        </div>
      </div>

      <NutritionStrip nutrition={preview?.nutrition || product.nutrition} className="mb-2" />
      <p className="mb-6 flex items-start gap-1.5 text-[11px] leading-relaxed text-charcoal/45">
        <Info size={12} className="mt-px shrink-0" />
        {NUTRITION_DISCLAIMER}
      </p>

      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      <div className="space-y-6">
        {groups.map((group) => {
          const selected = selectedFor(group.key);
          return (
            <fieldset key={group._id || group.key}>
              <legend className="mb-1 flex flex-wrap items-baseline gap-2">
                <span className="font-bold">{group.title}</span>
                {group.required && <span className="text-[11px] font-semibold text-carrot-600">Required</span>}
                {group.type === 'multiple' && (
                  <span className="text-[11px] text-charcoal/45">Choose up to {group.maxSelect}</span>
                )}
              </legend>
              {group.helpText && <p className="mb-2.5 text-xs text-charcoal/50">{group.helpText}</p>}

              <div className="grid gap-2 sm:grid-cols-2">
                {group.options.map((option) => {
                  const active = selected.includes(option._id);
                  return (
                    <button
                      key={option._id}
                      type="button"
                      disabled={!option.isAvailable}
                      onClick={() => toggle(group, option._id)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition',
                        active
                          ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-200'
                          : 'border-black/10 bg-white hover:border-brand-300',
                        !option.isAvailable && 'cursor-not-allowed opacity-40'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            'grid h-4 w-4 shrink-0 place-items-center border-2 transition',
                            group.type === 'single' ? 'rounded-full' : 'rounded-[5px]',
                            active ? 'border-brand-600 bg-brand-600' : 'border-black/20'
                          )}
                        >
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                        <span className="font-medium">{option.label}</span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-xs font-bold',
                          option.priceDelta > 0 ? 'text-carrot-600' : 'text-charcoal/35'
                        )}
                      >
                        {option.priceDelta > 0 ? '+' + formatINR(option.priceDelta) : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </Modal>
  );
}
