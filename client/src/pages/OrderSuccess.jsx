import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Truck, Receipt, Sparkles } from 'lucide-react';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import { ReceiptSkeleton } from '../components/ui/Skeleton';
import { orderApi } from '../api/endpoints';
import { formatINR, formatDateTime } from '../lib/utils';

export default function OrderSuccess() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    orderApi.track(orderNumber).then((res) => setOrder(res.data)).catch(() => setOrder(null));
  }, [orderNumber]);

  if (!order) return <ReceiptSkeleton label="Confirming your order" />;

  return (
    <Section>
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-100 text-brand-700">
          <CheckCircle2 size={38} />
        </span>
        <h1 className="mt-6 font-display text-3xl font-extrabold sm:text-4xl">Order confirmed!</h1>
        <p className="mt-3 leading-relaxed text-charcoal/65">
          Thank you! Our kitchen has your order and will start preparing it fresh. You will get an email
          confirmation, and you can watch the live progress any time.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-card">
          <Receipt size={18} className="text-brand-600" />
          <span className="font-mono text-lg font-extrabold">{order.orderNumber}</span>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-5">
        <div className="card p-5">
          <h2 className="h-card">Your snacks</h2>
          <ul className="mt-3 divide-y divide-black/5">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <SmartImage src={item.image} alt="" width={120} wrapperClassName="h-14 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  <p className="text-xs text-charcoal/50">Qty {item.quantity}</p>
                </div>
                <span className="shrink-0 font-bold">{formatINR(item.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-lg">
            <span className="font-bold">Total paid</span>
            <span className="font-extrabold text-brand-700">{formatINR(order.pricing.total)}</span>
          </div>
        </div>

        <div className="card flex items-start gap-4 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-carrot-50 text-carrot-600">
            <Truck size={20} />
          </span>
          <div>
            <h2 className="h-card">Arriving {order.deliverySlot.label}</h2>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/60">
              {formatDateTime(order.deliverySlot.date)} &middot; to {order.deliveryAddress.line1},{' '}
              {order.deliveryAddress.city} - {order.deliveryAddress.pincode}
            </p>
          </div>
        </div>

        <div className="card flex items-start gap-4 bg-brand-50 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-brand-600">
            <Sparkles size={20} />
          </span>
          <div>
            <h2 className="h-card">No subscription, no follow-up charges</h2>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/65">
              This was a single, one-time order. Nothing will renew and nothing will be charged again unless you
              place another order yourself.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button to={'/track-order?order=' + order.orderNumber} size="lg" className="flex-1">
            Track this order
          </Button>
          <Button to="/menu" variant="outline" size="lg" className="flex-1">
            Order something else
          </Button>
        </div>

        <p className="text-center text-sm text-charcoal/50">
          Need help? <Link to="/contact" className="font-semibold underline underline-offset-2">Contact our team</Link>
        </p>
      </div>
    </Section>
  );
}
