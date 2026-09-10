import { useEffect, useState } from 'react';
import { Star, Trash2, Pencil } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import SmartImage from '../../components/ui/SmartImage';
import Rating, { StarPicker } from '../../components/ui/Rating';
import EmptyState from '../../components/ui/EmptyState';
import { BlockListSkeleton } from '../../components/ui/Skeleton';
import { Input, Textarea } from '../../components/ui/Input';
import { reviewApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/utils';

export default function Reviews() {
  const [pending, setPending] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const load = () => {
    setLoading(true);
    Promise.all([reviewApi.pending(), reviewApi.mine()])
      .then(([p, m]) => {
        setPending(p.data);
        setMine(m.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openForm = (item, existing) => {
    setTarget({ ...item, existingId: existing?._id });
    setForm({
      rating: existing?.rating || 5,
      title: existing?.title || '',
      comment: existing?.comment || '',
    });
  };

  const submit = async () => {
    setSaving(true);
    try {
      if (target.existingId) {
        await reviewApi.update(target.existingId, form);
        toast.success('Review updated');
      } else {
        await reviewApi.create({
          productId: target.productId,
          orderId: target.orderId,
          rating: form.rating,
          ...(form.title ? { title: form.title } : {}),
          ...(form.comment ? { comment: form.comment } : {}),
        });
        toast.success('Thanks for your review!');
      }
      setTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    try {
      await reviewApi.remove(id);
      toast.success('Review removed');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-sub">Ratings &amp; Reviews</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          Rate a snack once its order is delivered. Your feedback goes straight to the kitchen.
        </p>
      </header>

      {loading ? (
        <BlockListSkeleton count={3} height="h-24" />
      ) : (
        <>
          <section>
            <h2 className="h-card mb-4">Waiting for your review</h2>
            {pending.length === 0 ? (
              <EmptyState
                icon={Star}
                size="sm"
                title="Nothing waiting right now"
                description="Rate a snack after your next delivery."
              />
            ) : (
              <div className="space-y-3">
                {pending.map((item) => (
                  <article key={item.productId + item.orderId} className="card flex items-center gap-4 p-4">
                    <SmartImage src={item.image} alt="" width={120} wrapperClassName="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{item.name}</p>
                      <p className="text-xs text-charcoal/45">
                        {item.orderNumber} &middot; delivered {formatDate(item.deliveredAt)}
                      </p>
                    </div>
                    <Button size="sm" icon={Star} onClick={() => openForm(item)}>Rate</Button>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="h-card mb-4">Your reviews</h2>
            {mine.length === 0 ? (
              <EmptyState
                icon={Star}
                title="You have not written a review yet"
                description="Once you rate a snack it will appear here, along with any reply from our kitchen."
              />
            ) : (
              <div className="space-y-3">
                {mine.map((r) => (
                  <article key={r._id} className="card p-5">
                    <div className="flex items-start gap-4">
                      <SmartImage
                        src={r.product?.images?.[0]?.url}
                        alt=""
                        width={120}
                        wrapperClassName="h-14 w-14 shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{r.product?.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Rating value={r.rating} showValue={false} />
                          <span className="text-xs text-charcoal/45">{formatDate(r.createdAt)}</span>
                        </div>
                        {r.title && <p className="mt-2 text-sm font-bold">{r.title}</p>}
                        {r.comment && <p className="mt-1 text-sm leading-relaxed text-charcoal/65">{r.comment}</p>}
                        {r.adminReply?.text && (
                          <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs leading-relaxed text-charcoal/60">
                            <strong className="text-brand-700">Kitchen replied:</strong> {r.adminReply.text}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2 border-t border-black/5 pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Pencil}
                        onClick={() => openForm({ productId: r.product?._id, name: r.product?.name }, r)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => remove(r._id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        title={target?.existingId ? 'Edit your review' : 'Rate ' + (target?.name || 'this snack')}
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" size="md" onClick={() => setTarget(null)} className="flex-1">Cancel</Button>
            <Button size="md" loading={saving} onClick={submit} className="flex-1">
              {target?.existingId ? 'Save changes' : 'Post review'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="label">How was it?</p>
            <StarPicker value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
          </div>
          <Input
            label="Headline (optional)"
            maxLength={90}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Genuinely filling and fresh"
          />
          <Textarea
            label="Your review (optional)"
            rows={4}
            maxLength={800}
            value={form.comment}
            onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
            placeholder="What did you like? Anything we should improve?"
          />
        </div>
      </Modal>
    </div>
  );
}
