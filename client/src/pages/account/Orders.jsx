import { useEffect, useState } from 'react';
import { Package, ChevronRight, XCircle, RotateCcw, Star } from 'lucide-react';
import Button from '../../components/ui/Button';
import SmartImage from '../../components/ui/SmartImage';
import EmptyState from '../../components/ui/EmptyState';
import ChipToggle from '../../components/ui/ChipToggle';
import { BlockListSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Input';
import { orderApi } from '../../api/endpoints';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatINR, formatDateTime, cn } from '../../lib/utils';

const STATUS_TONE = {
  Confirmed: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  Preparing: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Packed: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  'Out for Delivery': 'bg-carrot-50 text-carrot-700 ring-1 ring-carrot-200',
  Delivered: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  Cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const FILTERS = ['All', 'Confirmed', 'Preparing', 'Packed', 'Out for Delivery', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const { addItem, openCart } = useCart();
  const toast = useToast();

  const load = () => {
    setLoading(true);
    orderApi
      .mine({ limit: 30, ...(filter !== 'All' ? { status: filter } : {}) })
      .then((res) => setOrders(res.data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const reorder = (order) => {
    order.items
      .filter((i) => i.kind === 'product' && i.product)
      .forEach((i) =>
        addItem({
          kind: 'product',
          productId: i.product,
          quantity: i.quantity,
          customizations: [],
          meta: { name: i.name, image: i.image },
        })
      );
    toast.success('Added to your cart. Prices are refreshed to today.');
    openCart();
  };

  const cancelOrder = async () => {
    if (reason.trim().length < 3) return toast.error('Please tell us why you are cancelling');
    setCancelling(true);
    try {
      await orderApi.cancel(cancelTarget._id, reason.trim());
      toast.success('Order cancelled');
      setCancelTarget(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-sub">My Orders</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          Every order here was placed individually. There are no recurring charges on your account.
        </p>
      </header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {FILTERS.map((f) => (
          <ChipToggle key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f}
          </ChipToggle>
        ))}
      </div>

      {loading ? (
        <BlockListSkeleton count={3} height="h-40" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={filter === 'All' ? 'No orders yet' : 'No ' + filter.toLowerCase() + ' orders'}
          description="When you place an order it will show up here with its full history and live status."
          actionLabel="Explore Snacks"
          actionTo="/menu"
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = ['Confirmed', 'Preparing'].includes(order.status);
            return (
              <article key={order._id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-cream px-5 py-3.5">
                  <div>
                    <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
                    <p className="text-xs text-charcoal/50">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <span className={cn('chip', STATUS_TONE[order.status])}>{order.status}</span>
                </div>

                <div className="p-5">
                  <ul className="flex flex-wrap gap-3">
                    {order.items.slice(0, 4).map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <SmartImage src={item.image} alt="" width={100} wrapperClassName="h-12 w-12 rounded-xl" />
                        <span className="text-xs">
                          <span className="block max-w-[10rem] truncate font-semibold">{item.name}</span>
                          <span className="text-charcoal/45">Qty {item.quantity}</span>
                        </span>
                      </li>
                    ))}
                    {order.items.length > 4 && (
                      <li className="grid h-12 w-12 place-items-center rounded-xl bg-black/[.04] text-xs font-bold text-charcoal/50">
                        +{order.items.length - 4}
                      </li>
                    )}
                  </ul>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4">
                    <div>
                      <p className="text-lg font-extrabold text-brand-700">{formatINR(order.pricing.total)}</p>
                      <p className="text-xs capitalize text-charcoal/50">
                        {order.payment.method.toUpperCase()} &middot; {order.payment.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.status === 'Delivered' && (
                        <>
                          <Button variant="outline" size="sm" icon={RotateCcw} onClick={() => reorder(order)}>
                            Reorder
                          </Button>
                          {!order.isReviewed && (
                            <Button to="/account/reviews" variant="ghost" size="sm" icon={Star}>
                              Rate it
                            </Button>
                          )}
                        </>
                      )}
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={XCircle}
                          onClick={() => setCancelTarget(order)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        to={'/track-order?order=' + order.orderNumber}
                        variant="primary"
                        size="sm"
                        iconRight={ChevronRight}
                      >
                        Track
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this order?"
        description={cancelTarget ? 'Order ' + cancelTarget.orderNumber : ''}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={() => setCancelTarget(null)} className="flex-1">
              Keep order
            </Button>
            <Button
              size="md"
              loading={cancelling}
              onClick={cancelOrder}
              className="flex-1 !bg-red-600 hover:!bg-red-700"
            >
              Cancel order
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-sm leading-relaxed text-charcoal/65">
          You can cancel while an order is Confirmed or Preparing. Once it is packed we cannot cancel it, because
          the food has already been made fresh for you. Prepaid orders are refunded within 3-5 working days.
        </p>
        <Textarea
          label="Why are you cancelling?"
          rows={3}
          maxLength={300}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Ordered by mistake, plans changed"
        />
      </Modal>
    </div>
  );
}
