import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trash2, ShoppingBag, ArrowRight, Package } from 'lucide-react';
import Skeleton from '../ui/Skeleton';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../lib/utils';
import Button, { IconButton } from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import QuantityStepper from '../ui/QuantityStepper';
import SmartImage from '../ui/SmartImage';
import { FoodTypeMark } from '../ui/Badge';

export default function CartDrawer() {
  const { isOpen, closeCart, items, quote, isQuoting, quoteError, updateQuantity, removeItem, itemCount } = useCart();
  const navigate = useNavigate();

  // Quote lines come back in the same order they were sent, so they pair by index.
  const lineFor = (index) => quote?.items?.[index];

  const goToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="absolute inset-y-0 right-0 flex w-full flex-col bg-cream shadow-pop sm:max-w-md"
            role="dialog"
            aria-label="Shopping cart"
          >
            <header className="flex items-center justify-between border-b border-black/5 bg-white px-5 py-4">
              <div>
                <h2 className="h-card">Your Cart</h2>
                <p className="text-xs text-charcoal/50">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
              </div>
              <IconButton icon={X} label="Close cart" onClick={closeCart} />
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 items-center px-5">
                <EmptyState
                  icon={ShoppingBag}
                  size="sm"
                  title="Your cart is empty"
                  description={
                    'Fresh salad bowls, wraps, smoothies and oats jars are waiting. Snacks start at just ' +
                    formatINR(100) + '.'
                  }
                  actionLabel="Explore Snacks"
                  actionTo="/menu"
                  onAction={closeCart}
                  className="w-full border-0 bg-transparent"
                />
              </div>
            ) : (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">
                  {items.map((item, index) => {
                    const line = lineFor(index);
                    return (
                      <div key={item.lineId} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card">
                        <SmartImage
                          src={line?.image || item.meta?.image}
                          alt=""
                          width={160}
                          wrapperClassName="h-16 w-16 shrink-0 rounded-xl xs:h-20 xs:w-20"
                        />

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-sm font-bold">
                                {line?.foodType && <FoodTypeMark type={line.foodType} size={12} />}
                                <span className="truncate">{line?.name || item.meta?.name || <Skeleton className="inline-block h-3.5 w-24 align-middle" />}</span>
                              </p>
                              {item.kind === 'snackbox' && (
                                <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-carrot-600">
                                  <Package size={11} /> One-time box
                                </span>
                              )}
                            </div>
                            <IconButton icon={Trash2} label="Remove item" tone="danger" size="sm" onClick={() => removeItem(item.lineId)} />
                          </div>

                          {line?.customizations?.length > 0 && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-charcoal/50">
                              {line.customizations
                                .flatMap((c) => c.selections.map((s) => s.label))
                                .join(', ')}
                            </p>
                          )}

                          {item.kind === 'snackbox' && line?.boxItems?.length > 0 && (
                            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-charcoal/50">
                              {line.boxItems.map((b) => b.quantity + 'x ' + b.name).join(', ')}
                            </p>
                          )}

                          <div className="mt-auto flex items-center justify-between pt-2">
                            <QuantityStepper
                              size="sm"
                              value={item.quantity}
                              onChange={(q) => updateQuantity(item.lineId, q)}
                              min={0}
                              label={'quantity of ' + (line?.name || 'this item')}
                            />
                            <span className="text-sm font-extrabold text-brand-700">
                              {line ? formatINR(line.lineTotal) : <Skeleton className="h-5 w-16" />}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {quoteError && (
                    <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{quoteError}</p>
                  )}
                </div>

                <footer className="border-t border-black/5 bg-white p-4 pb-safe-4">
                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-charcoal/60">Items</dt>
                      <dd className="font-semibold">{formatINR(quote?.itemsTotal || 0)}</dd>
                    </div>
                    {quote?.customizationTotal > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-charcoal/60">Customization</dt>
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
                      <dt className="text-charcoal/60">Delivery</dt>
                      <dd className="font-semibold">
                        {quote?.deliveryFee === 0 ? (
                          <span className="text-brand-700">FREE</span>
                        ) : (
                          formatINR(quote?.deliveryFee || 0)
                        )}
                      </dd>
                    </div>
                    {quote?.tax > 0 && (
                      <div className="flex justify-between">
                        <dt className="text-charcoal/60">Taxes</dt>
                        <dd className="font-semibold">{formatINR(quote.tax)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-black/5 pt-2.5 text-base">
                      <dt className="font-bold">Total</dt>
                      <dd className="font-extrabold text-brand-700">
                        {isQuoting ? <Skeleton className="h-5 w-20" /> : formatINR(quote?.total || 0)}
                      </dd>
                    </div>
                  </dl>

                  {quote && quote.deliveryFee > 0 && quote.config?.freeDeliveryAbove && (
                    <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-medium text-brand-800">
                      Add {formatINR(quote.config.freeDeliveryAbove - (quote.subtotal - quote.discount))} more for free delivery.
                    </p>
                  )}

                  <Button
                    onClick={goToCheckout}
                    size="lg"
                    iconRight={ArrowRight}
                    disabled={isQuoting || Boolean(quoteError)}
                    className="mt-4 w-full"
                  >
                    Proceed to Checkout
                  </Button>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
