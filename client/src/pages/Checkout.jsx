import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin, CalendarDays, CreditCard, ShieldCheck, Check, Plus, Wallet, Banknote, Smartphone,
} from 'lucide-react';
import Section from '../components/ui/Section';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import SmartImage from '../components/ui/SmartImage';
import EmptyState from '../components/ui/EmptyState';
import Skeleton, { OptionGridSkeleton } from '../components/ui/Skeleton';
import { deliveryApi, orderApi, paymentApi, userApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { formatINR, upcomingDates, cn } from '../lib/utils';
import { loadRazorpay } from '../lib/razorpay';

const addressSchema = z.object({
  label: z.enum(['home', 'work', 'hostel', 'other']).default('home'),
  fullName: z.string().trim().min(2, 'Enter the recipient name'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number'),
  line1: z.string().trim().min(4, 'Flat, building and street are required'),
  line2: z.string().trim().optional(),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().trim().min(2, 'State is required'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6 digit pincode'),
});

const PAYMENT_ICONS = { upi: Smartphone, razorpay: CreditCard, cod: Banknote };

export default function Checkout() {
  const settings = useSettings();
  const { items, quote, isQuoting, couponCode, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const dates = useMemo(() => upcomingDates(5), []);
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [slots, setSlots] = useState([]);
  const [slotId, setSlotId] = useState('');
  const [addressId, setAddressId] = useState(user?.addresses?.find((a) => a.isDefault)?._id || user?.addresses?.[0]?._id || '');
  const [showNewAddress, setShowNewAddress] = useState(!user?.addresses?.length);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [note, setNote] = useState('');
  const [placing, setPlacing] = useState(false);

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(addressSchema), defaultValues: { label: 'home', city: '', state: '' } });

  useEffect(() => {
    paymentApi.methods().then((res) => {
      setPaymentMethods(res.data);
      const firstEnabled = res.data.find((m) => m.enabled);
      if (firstEnabled) setPaymentMethod(firstEnabled.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSlotId('');
    deliveryApi
      .slots(selectedDate)
      .then((res) => {
        setSlots(res.data);
        const first = res.data.find((s) => s.isAvailable);
        if (first) setSlotId(first._id);
      })
      .catch(() => setSlots([]));
  }, [selectedDate]);

  const saveAddress = async (values) => {
    try {
      const res = await userApi.addAddress({ ...values, isDefault: !user?.addresses?.length });
      await refreshUser();
      const created = res.data[res.data.length - 1];
      setAddressId(created._id);
      setShowNewAddress(false);
      toast.success('Address saved');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const placeOrder = async () => {
    if (!addressId) return toast.error('Please choose a delivery address');
    if (!slotId) return toast.error('Please choose a delivery slot');

    setPlacing(true);
    try {
      const res = await orderApi.create({
        items: items.map(({ lineId, meta, ...rest }) => rest),
        ...(couponCode ? { couponCode } : {}),
        addressId,
        slotId,
        deliveryDate: selectedDate,
        paymentMethod,
        ...(note ? { customerNote: note } : {}),
      });

      const { order, checkout } = res.data;

      if (paymentMethod === 'cod' || !checkout) {
        clearCart();
        toast.success('Order placed! We are getting your snacks ready.');
        return navigate('/order-success/' + order.orderNumber);
      }

      await payWithRazorpay(order, checkout);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const payWithRazorpay = async (order, checkout) => {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('We could not load the payment window. Please try Cash on Delivery.');
      return;
    }

    const rzp = new window.Razorpay({
      key: checkout.keyId,
      amount: checkout.amount,
      currency: checkout.currency,
      order_id: checkout.id,
      name: settings.brandName,
      description: 'Order ' + order.orderNumber,
      image: settings.branding?.logoUrl || undefined,
      prefill: { name: user.name, email: user.email, contact: order.contactPhone },
      theme: { color: '#16a34a' },
      handler: async (response) => {
        try {
          await paymentApi.verify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          clearCart();
          toast.success('Payment successful!');
          navigate('/order-success/' + order.orderNumber);
        } catch (err) {
          toast.error(err.message);
          navigate('/account/orders');
        }
      },
      modal: {
        ondismiss: () => {
          toast.info('Payment cancelled. Your order is saved under My Orders.');
          navigate('/account/orders');
        },
      },
    });
    rzp.open();
  };

  if (items.length === 0) {
    return (
      <Section>
        <EmptyState
          title="There is nothing to check out"
          description="Add a few snacks to your cart first."
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
        title="Checkout"
        subtitle="One order, one payment. Nothing recurring."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* ------------------------------ Address ------------------------------ */}
          <section className="card p-5 sm:p-6">
            <h2 className="h-card">
              <MapPin size={19} className="text-brand-600" /> Delivery Address
            </h2>

            {user?.addresses?.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {user.addresses.map((a) => (
                  <button
                    key={a._id}
                    type="button"
                    aria-pressed={addressId === a._id}
                    onClick={() => { setAddressId(a._id); setShowNewAddress(false); }}
                    className={cn(
                      'rounded-2xl border p-4 text-left text-sm transition',
                      addressId === a._id && !showNewAddress
                        ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-200'
                        : 'border-black/10 bg-white hover:border-brand-300'
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="chip-neutral capitalize">{a.label}</span>
                      {addressId === a._id && !showNewAddress && <Check size={16} className="text-brand-600" />}
                    </span>
                    <span className="mt-2 block font-bold">{a.fullName}</span>
                    <span className="mt-0.5 block leading-relaxed text-charcoal/60">
                      {a.line1}{a.line2 ? ', ' + a.line2 : ''}
                      {a.landmark ? ', near ' + a.landmark : ''}
                      <br />
                      {a.city}, {a.state} - {a.pincode}
                    </span>
                    <span className="mt-1 block text-charcoal/50">{a.phone}</span>
                  </button>
                ))}
              </div>
            )}

            {!showNewAddress ? (
              <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowNewAddress(true)} className="mt-4">
                Add a new address
              </Button>
            ) : (
              <form onSubmit={handleSubmit(saveAddress)} className="mt-4 grid gap-4 sm:grid-cols-2">
                <Select label="Address type" {...register('label')} error={errors.label?.message}>
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="hostel">Hostel / PG</option>
                  <option value="other">Other</option>
                </Select>
                <Input label="Recipient name" {...register('fullName')} error={errors.fullName?.message} />
                <Input label="Mobile number" inputMode="numeric" maxLength={10} {...register('phone')} error={errors.phone?.message} />
                <Input label="Pincode" inputMode="numeric" maxLength={6} {...register('pincode')} error={errors.pincode?.message} />
                <Input className="sm:col-span-2" label="Flat, building, street" {...register('line1')} error={errors.line1?.message} />
                <Input label="Area / locality (optional)" {...register('line2')} error={errors.line2?.message} />
                <Input label="Landmark (optional)" {...register('landmark')} error={errors.landmark?.message} />
                <Input label="City" {...register('city')} error={errors.city?.message} />
                <Input label="State" {...register('state')} error={errors.state?.message} />

                <div className="flex gap-3 sm:col-span-2">
                  <Button type="submit" loading={isSubmitting} size="md">Save address</Button>
                  {user?.addresses?.length > 0 && (
                    <Button type="button" variant="ghost" size="md" onClick={() => setShowNewAddress(false)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* --------------------------- Delivery slot --------------------------- */}
          <section className="card p-5 sm:p-6">
            <h2 className="h-card">
              <CalendarDays size={19} className="text-brand-600" /> Delivery Date &amp; Time
            </h2>

            <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1">
              {dates.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  aria-pressed={selectedDate === d.value}
                  onClick={() => setSelectedDate(d.value)}
                  className={cn(
                    'min-w-[5.5rem] shrink-0 rounded-2xl border px-4 py-3 text-center transition',
                    selectedDate === d.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-black/10 bg-white hover:border-brand-300'
                  )}
                >
                  <span className="block text-sm font-bold">{d.label}</span>
                  <span className={cn('block text-[11px]', selectedDate === d.value ? 'text-white/75' : 'text-charcoal/45')}>
                    {d.sub}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {slots.length === 0 ? (
                <OptionGridSkeleton count={4} className="col-span-full" />
              ) : (
                slots.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    aria-pressed={slotId === s._id}
                    disabled={!s.isAvailable}
                    onClick={() => setSlotId(s._id)}
                    className={cn(
                      'rounded-2xl border px-4 py-3 text-left text-sm transition',
                      slotId === s._id
                        ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-200'
                        : 'border-black/10 bg-white hover:border-brand-300',
                      !s.isAvailable && 'cursor-not-allowed opacity-45'
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-semibold">{s.label}</span>
                      {slotId === s._id && <Check size={15} className="text-brand-600" />}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-charcoal/50">
                      {s.reason || s.remaining + ' slots left'}
                    </span>
                  </button>
                ))
              )}
            </div>

            <Textarea
              className="mt-4"
              label="Any instructions for the kitchen? (optional)"
              rows={2}
              maxLength={300}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Less spicy, ring the bell twice, leave at reception"
            />
          </section>

          {/* ------------------------------ Payment ------------------------------ */}
          <section className="card p-5 sm:p-6">
            <h2 className="h-card">
              <Wallet size={19} className="text-brand-600" /> Payment Method
            </h2>

            <div className="mt-4 space-y-3">
              {paymentMethods.map((m) => {
                const Icon = PAYMENT_ICONS[m.id] || CreditCard;
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={paymentMethod === m.id}
                    disabled={!m.enabled}
                    onClick={() => setPaymentMethod(m.id)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition',
                      paymentMethod === m.id
                        ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-200'
                        : 'border-black/10 bg-white hover:border-brand-300',
                      !m.enabled && 'cursor-not-allowed opacity-45'
                    )}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white ring-1 ring-black/5">
                      <Icon size={18} className="text-brand-700" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{m.label}</span>
                      <span className="block text-xs text-charcoal/55">
                        {m.enabled ? m.description : 'Currently unavailable'}
                      </span>
                    </span>
                    {paymentMethod === m.id && <Check size={18} className="shrink-0 text-brand-600" />}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-charcoal/50">
              <ShieldCheck size={14} className="mt-px shrink-0 text-brand-600" />
              Payments are processed securely by Razorpay. We never see or store your card details.
            </p>
          </section>
        </div>

        {/* --------------------------- Order summary --------------------------- */}
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="card p-5">
            <h2 className="h-card">Order Summary</h2>

            <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto border-b border-black/5 pb-4">
              {(quote?.items || []).map((line, i) => (
                <li key={i} className="flex gap-3">
                  <SmartImage src={line.image} alt="" width={100} wrapperClassName="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{line.name}</p>
                    <p className="text-[11px] text-charcoal/50">Qty {line.quantity}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{formatINR(line.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 text-sm">
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
                  <dt>Discount {quote.coupon ? '(' + quote.coupon.code + ')' : ''}</dt>
                  <dd className="font-semibold">-{formatINR(quote.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-charcoal/60">Delivery</dt>
                <dd className="font-semibold">
                  {quote?.deliveryFee === 0 ? <span className="text-brand-700">FREE</span> : formatINR(quote?.deliveryFee || 0)}
                </dd>
              </div>
              {quote?.tax > 0 && (
                <div className="flex justify-between">
                  <dt className="text-charcoal/60">Taxes</dt>
                  <dd className="font-semibold">{formatINR(quote.tax)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-black/5 pt-3 text-lg">
                <dt className="font-bold">To pay</dt>
                <dd className="font-extrabold text-brand-700">
                  {isQuoting ? <Skeleton className="h-6 w-24" /> : formatINR(quote?.total || 0)}
                </dd>
              </div>
            </dl>

            <Button
              onClick={placeOrder}
              size="lg"
              loading={placing}
              disabled={isQuoting || !addressId || !slotId}
              className="mt-5 w-full"
            >
              {paymentMethod === 'cod' ? 'Place Order' : 'Pay ' + formatINR(quote?.total || 0)}
            </Button>

            <p className="mt-3 text-center text-[11px] leading-relaxed text-charcoal/45">
              By placing this order you agree to our{' '}
              <a href="/terms" className="underline underline-offset-2">Terms</a> and{' '}
              <a href="/privacy" className="underline underline-offset-2">Privacy Policy</a>.
            </p>
          </div>
        </aside>
      </div>
    </Section>
  );
}
