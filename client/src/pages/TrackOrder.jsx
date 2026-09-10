import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, CheckCircle2, ChefHat, PackageCheck, Bike, PartyPopper, XCircle, MapPin, Clock, Radio,
} from 'lucide-react';
import Section from '../components/ui/Section';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import { FoodTypeMark } from '../components/ui/Badge';
import { TrackingSkeleton } from '../components/ui/Skeleton';
import { orderApi } from '../api/endpoints';
import { useOrderTracking } from '../hooks/useSocket';
import { useToast } from '../context/ToastContext';
import { formatINR, formatDateTime, cn } from '../lib/utils';
import { STATUS_COPY } from '../lib/constants';

const STEP_ICONS = {
  Confirmed: CheckCircle2,
  Preparing: ChefHat,
  Packed: PackageCheck,
  'Out for Delivery': Bike,
  Delivered: PartyPopper,
};

export default function TrackOrder() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get('order') || '';

  const [orderNumber, setOrderNumber] = useState(initial);
  const [input, setInput] = useState(initial);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const toast = useToast();

  const fetchOrder = useCallback(
    async (number) => {
      if (!number) return;
      setLoading(true);
      setError(null);
      try {
        const res = await orderApi.track(number.trim().toUpperCase());
        setData(res.data);
        // Live push only reaches the account that owns the order; a public
        // lookup gets the snapshot, so do not advertise a live feed it has not got.
        setLive(!res.data?.isRedacted);
      } catch (err) {
        setError(err.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initial) fetchOrder(initial);
  }, [initial, fetchOrder]);

  // Admin status changes arrive over the socket and refresh the timeline live.
  useOrderTracking(orderNumber, (payload) => {
    if (payload?.orderNumber !== orderNumber) return;
    toast.success(STATUS_COPY[payload.status] || 'Order updated');
    fetchOrder(orderNumber);
  });

  const submit = (e) => {
    e.preventDefault();
    const number = input.trim().toUpperCase();
    if (!number) return;
    setOrderNumber(number);
    setSearchParams({ order: number });
    fetchOrder(number);
  };

  return (
    <>
      <PageHeader
        title="Track Your Order"
        subtitle="Enter your order number to follow your snack from our kitchen to your door. Updates appear here the moment our team moves your order along."
      >
        <form onSubmit={submit} className="mt-6 flex max-w-lg gap-2">
          <div className="relative flex-1">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="BW-20260908-1234"
              aria-label="Order number"
              className="input rounded-full pl-11 font-mono uppercase tracking-wide"
            />
          </div>
          <Button type="submit" size="md" loading={loading}>Track</Button>
        </form>

        <p className="mt-3 text-xs text-charcoal/45">
          Your order number is on your confirmation email, or under{' '}
          <Link to="/account/orders" className="font-semibold underline underline-offset-2">My Orders</Link>.
        </p>
      </PageHeader>

      <Section pad="flush">
        {loading && !data && <TrackingSkeleton />}

        {error && (
          <EmptyState
            icon={XCircle}
            tone="error"
            size="sm"
            title={error}
            description="Double-check the order number, or sign in to see all of your orders."
            actionLabel="Go to My Orders"
            actionTo="/account/orders"
            className="mx-auto max-w-lg"
          />
        )}

        {data && (
          <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-6">
              <section className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-charcoal/45">Order number</p>
                    <p className="font-mono text-lg font-extrabold">{data.orderNumber}</p>
                    <p className="mt-1 text-sm text-charcoal/55">Placed {formatDateTime(data.placedAt)}</p>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        'chip',
                        data.isCancelled ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                      )}
                    >
                      {live && !data.isCancelled && <Radio size={12} className="animate-pulse" />}
                      {data.status}
                    </span>
                    {data.estimatedDeliveryAt && !data.isCancelled && data.status !== 'Delivered' && (
                      <p className="mt-1.5 text-xs text-charcoal/50">
                        Expected by {formatDateTime(data.estimatedDeliveryAt)}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm font-medium text-charcoal/70">
                  {data.isCancelled ? data.cancellationReason || STATUS_COPY.Cancelled : STATUS_COPY[data.status]}
                </p>
              </section>

              {!data.isCancelled && (
                <section className="card p-6">
                  <h2 className="h-card mb-6">Order Progress</h2>

                  <ol className="relative">
                    {data.timeline.map((step, i) => {
                      const Icon = STEP_ICONS[step.status] || CheckCircle2;
                      const isLast = i === data.timeline.length - 1;
                      return (
                        <li key={step.status} className="relative flex gap-4 pb-8 last:pb-0">
                          {!isLast && (
                            <span
                              className={cn(
                                'absolute left-[1.375rem] top-11 h-[calc(100%-1.5rem)] w-0.5',
                                step.isDone ? 'bg-brand-500' : 'bg-black/[.08]'
                              )}
                            />
                          )}

                          <span
                            className={cn(
                              'relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full transition',
                              step.isCurrent
                                ? 'bg-brand-600 text-white shadow-lift ring-4 ring-brand-100'
                                : step.isDone
                                  ? 'bg-brand-500 text-white'
                                  : 'bg-black/[.06] text-charcoal/35'
                            )}
                          >
                            <Icon size={19} />
                          </span>

                          <div className="pt-1.5">
                            <p className={cn('font-bold', step.isDone ? 'text-charcoal' : 'text-charcoal/40')}>
                              {step.status}
                            </p>
                            <p className="mt-0.5 text-sm leading-relaxed text-charcoal/55">
                              {STATUS_COPY[step.status]}
                            </p>
                            {step.at && (
                              <p className="mt-1 text-xs font-medium text-brand-700">{formatDateTime(step.at)}</p>
                            )}
                            {step.note && <p className="mt-0.5 text-xs text-charcoal/45">{step.note}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              <section className="card p-6">
                <h2 className="h-card mb-4">Items in this order</h2>
                <ul className="divide-y divide-black/5">
                  {data.items.map((item, i) => (
                    <li key={i} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                      <SmartImage src={item.image} alt="" width={140} wrapperClassName="h-16 w-16 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 font-semibold">
                          <FoodTypeMark type={item.foodType} size={12} />
                          <span className="truncate">{item.name}</span>
                        </p>
                        {item.customizations?.length > 0 && (
                          <p className="mt-0.5 text-xs leading-snug text-charcoal/50">
                            {item.customizations.flatMap((c) => c.selections.map((s) => s.label)).join(', ')}
                          </p>
                        )}
                        {item.boxItems?.length > 0 && (
                          <p className="mt-0.5 text-xs leading-snug text-charcoal/50">
                            {item.boxItems.map((b) => b.quantity + 'x ' + b.name).join(', ')}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-charcoal/45">Qty {item.quantity}</p>
                      </div>
                      <span className="shrink-0 font-bold">{formatINR(item.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="card p-5">
                <h2 className="h-card">
                  <MapPin size={17} className="text-brand-600" /> Delivering to
                </h2>
                <address className="mt-3 text-sm not-italic leading-relaxed text-charcoal/65">
                  <strong className="block font-bold text-charcoal">{data.deliveryAddress.fullName}</strong>
                  {data.deliveryAddress.line1}
                  {data.deliveryAddress.line2 ? ', ' + data.deliveryAddress.line2 : ''}
                  {data.deliveryAddress.landmark ? ', near ' + data.deliveryAddress.landmark : ''}
                  <br />
                  {data.deliveryAddress.city}, {data.deliveryAddress.state} - {data.deliveryAddress.pincode}
                  <br />
                  <span className="text-charcoal/50">{data.deliveryAddress.phone}</span>
                </address>
                {data.isRedacted ? (
                  <p className="mt-3 text-xs text-charcoal/50">
                    Personal details are hidden on public tracking.{' '}
                    <Link to="/login" className="font-semibold text-brand-600 underline">
                      Sign in
                    </Link>{' '}
                    to see the full delivery address.
                  </p>
                ) : null}
              </section>

              <section className="card p-5">
                <h2 className="h-card">
                  <Clock size={17} className="text-brand-600" /> Delivery slot
                </h2>
                <p className="mt-2 text-sm font-semibold">{data.deliverySlot.label}</p>
                <p className="text-xs text-charcoal/50">{formatDateTime(data.deliverySlot.date)}</p>
              </section>

              <section className="card p-5">
                <h2 className="h-card">Payment</h2>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-charcoal/60">Method</dt>
                    <dd className="font-semibold uppercase">{data.payment.method}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-charcoal/60">Status</dt>
                    <dd
                      className={cn(
                        'font-semibold capitalize',
                        data.payment.status === 'paid' ? 'text-brand-700' : 'text-amber-700'
                      )}
                    >
                      {data.payment.status}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-black/5 pt-2 text-base">
                    <dt className="font-bold">Total</dt>
                    <dd className="font-extrabold text-brand-700">{formatINR(data.pricing.total)}</dd>
                  </div>
                </dl>
              </section>

              <Button to="/menu" variant="outline" size="md" className="w-full">
                Order something else
              </Button>
            </aside>
          </div>
        )}
      </Section>
    </>
  );
}
