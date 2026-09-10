import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Tag, ArrowRight, ShoppingBag, Package, X } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import Section from '../components/ui/Section';
import QuantityStepper from '../components/ui/QuantityStepper';
import PageHeader from '../components/ui/PageHeader';
import Button, { IconButton } from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import { FoodTypeMark } from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import NutritionStrip from '../components/product/NutritionStrip';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../lib/utils';
import { NUTRITION_DISCLAIMER } from '../lib/constants';
import { useSettings } from '../context/SettingsContext';

export default function Cart() {
  const { items, quote, isQuoting, quoteError, updateQuantity, removeItem, couponCode, setCouponCode } = useCart();
  const settings = useSettings();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [codeInput, setCodeInput] = useState('');

  const applyCoupon = (e) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setCouponCode(code);
    toast.info('Checking ' + code + '...');
  };

  const proceed = () => {
    if (!isAuthenticated) {
      toast.info('Please sign in to complete your order');
      return navigate('/login', { state: { from: { pathname: '/checkout' } } });
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <Section>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description={'Fresh salad bowls, protein wraps, smoothies and oats jars are waiting. Snacks start at just ' + formatINR(settings.minOrderValue) + ' and there is no subscription to sign up for.'}
          actionLabel="Explore Snacks"
          actionTo="/menu"
        />
      </Section>
    );
  }

  return (
    <Section>
      <PageHeader
        tone="bare"
        title="Your Cart"
        subtitle="Review your snacks, apply a coupon and head to checkout. Nothing recurring, ever."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {items.map((item, index) => {
            const line = quote?.items?.[index];
            return (
              <article key={item.lineId} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
                <SmartImage
                  src={line?.image || item.meta?.image}
                  alt=""
                  width={220}
                  wrapperClassName="h-20 w-20 shrink-0 rounded-2xl xs:h-24 xs:w-24 sm:h-32 sm:w-32"
                />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-2 font-bold">
                        {line?.foodType && <FoodTypeMark type={line.foodType} size={13} />}
                        {line?.slug ? (
                          <Link to={'/menu/' + line.slug} className="truncate hover:text-brand-700">
                            {line.name}
                          </Link>
                        ) : (
                          <span className="truncate">{line?.name || item.meta?.name || <Skeleton className="inline-block h-4 w-32 align-middle" />}</span>
                        )}
                      </h2>

                      {item.kind === 'snackbox' && (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-carrot-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-carrot-700">
                          <Package size={11} /> One-time box
                        </span>
                      )}

                      {line?.categoryName && item.kind !== 'snackbox' && (
                        <p className="mt-0.5 text-xs text-charcoal/45">{line.categoryName}</p>
                      )}
                    </div>

                    <IconButton icon={Trash2} label="Remove from cart" tone="danger" size="sm" onClick={() => removeItem(item.lineId)} />
                  </div>

                  {line?.customizations?.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {line.customizations.map((c) => (
                        <li key={c.groupKey} className="text-xs text-charcoal/55">
                          <span className="font-semibold text-charcoal/70">{c.groupTitle}:</span>{' '}
                          {c.selections.map((s) => s.label).join(', ')}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.kind === 'snackbox' && line?.boxItems?.length > 0 && (
                    <p className="mt-2 text-xs leading-relaxed text-charcoal/55">
                      {line.boxItems.map((b) => b.quantity + 'x ' + b.name).join(', ')}
                    </p>
                  )}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.lineId, q)}
                      min={0}
                      label={'quantity of ' + (line?.name || 'this item')}
                    />

                    <div className="text-right">
                      <p className="text-lg font-extrabold text-brand-700">
                        {line ? formatINR(line.lineTotal) : <Skeleton className="ml-auto h-6 w-20" />}
                      </p>
                      {line?.customizationPrice > 0 && (
                        <p className="text-[11px] text-charcoal/45">
                          {formatINR(line.basePrice)} + {formatINR(line.customizationPrice)} customization
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {quoteError && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{quoteError}</p>
          )}

          {quote?.nutritionTotal && (
            <div className="card p-5">
              <h2 className="h-card mb-3">Approximate nutrition for this order</h2>
              <NutritionStrip nutrition={quote.nutritionTotal} />
              <p className="mt-2.5 text-[11px] leading-relaxed text-charcoal/45">{NUTRITION_DISCLAIMER}</p>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="card p-5">
            <h2 className="h-card">Order Summary</h2>

            <form onSubmit={applyCoupon} className="mt-4">
              <label htmlFor="coupon" className="label">Have a coupon?</label>
              {quote?.coupon ? (
                <div className="flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 ring-1 ring-brand-200">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-brand-800">
                      <Tag size={14} /> {quote.coupon.code}
                    </p>
                    <p className="truncate text-[11px] text-brand-700/70">{quote.coupon.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCouponCode(''); setCodeInput(''); }}
                    aria-label="Remove coupon"
                    className="shrink-0 rounded-full p-1 text-brand-700 hover:bg-brand-100"
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    id="coupon"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="FRESH50"
                    className="input uppercase"
                  />
                  <Button type="submit" variant="dark" size="md" disabled={!codeInput.trim()}>
                    Apply
                  </Button>
                </div>
              )}
            </form>

            <dl className="mt-5 space-y-2 border-t border-black/5 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-charcoal/60">Items</dt>
                <dd className="font-semibold">{formatINR(quote?.itemsTotal || 0)}</dd>
              </div>
              {quote?.customizationTotal > 0 && (
                <div className="flex justify-between">
                  <dt className="text-charcoal/60">Customization charges</dt>
                  <dd className="font-semibold">{formatINR(quote.customizationTotal)}</dd>
                </div>
              )}
              {quote?.discount > 0 && (
                <div className="flex justify-between text-brand-700">
                  <dt>Discount</dt>
                  <dd className="font-semibold">-{formatINR(quote.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-charcoal/60">Delivery charge</dt>
                <dd className="font-semibold">
                  {quote?.deliveryFee === 0 ? <span className="text-brand-700">FREE</span> : formatINR(quote?.deliveryFee || 0)}
                </dd>
              </div>
              {quote?.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-charcoal/60">Taxes ({quote.config?.taxPercent}%)</dt>
                  <dd className="font-semibold">{formatINR(quote.tax)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-black/5 pt-3 text-lg">
                <dt className="font-bold">Total</dt>
                <dd className="font-extrabold text-brand-700">
                  {isQuoting ? <Skeleton className="h-6 w-24" /> : formatINR(quote?.total || 0)}
                </dd>
              </div>
            </dl>

            {quote && quote.deliveryFee > 0 && quote.config?.freeDeliveryAbove && (
              <p className="mt-4 rounded-xl bg-brand-50 px-3 py-2.5 text-xs font-medium text-brand-800">
                Add {formatINR(quote.config.freeDeliveryAbove - (quote.subtotal - quote.discount))} more and delivery is on us.
              </p>
            )}

            <Button
              onClick={proceed}
              size="lg"
              iconRight={ArrowRight}
              disabled={isQuoting || Boolean(quoteError)}
              className="mt-5 w-full"
            >
              Proceed to Checkout
            </Button>

            <Link to="/menu" className="mt-3 block text-center text-sm font-semibold text-charcoal/55 hover:text-charcoal">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </Section>
  );
}
