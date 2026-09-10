import { useEffect, useState } from 'react';
import { Gift, Copy, Check, Users, Sparkles, Tag } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { userApi, couponApi } from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { formatINR, formatDate } from '../../lib/utils';

export default function Rewards() {
  const [rewards, setRewards] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  useEffect(() => {
    userApi.rewards().then((res) => setRewards(res.data)).catch(() => {});
    couponApi.available().then((res) => setCoupons(res.data)).catch(() => {});
  }, []);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      toast.error('Could not copy. Please copy it manually.');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-sub">Rewards &amp; Referrals</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          Earn points by referring friends, and use coupons on any single order.
        </p>
      </header>

      <section className="card overflow-hidden bg-brand-700 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm text-white/70">
              <Sparkles size={15} /> Your reward points
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{rewards?.rewardPoints ?? 0}</p>
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-2 text-sm text-white/70">
              <Users size={15} /> Friends referred
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">{rewards?.referrals ?? 0}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Your referral code</p>
          <div className="mt-2 flex items-center gap-3">
            <code className="min-w-0 break-all font-mono text-xl font-extrabold tracking-wider xs:text-2xl">
              {rewards?.referralCode || '...'}
            </code>
            <button
              onClick={() => copy(rewards?.referralCode)}
              aria-label="Copy referral code"
              className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 transition hover:bg-white/25"
            >
              {copied ? <Check size={17} /> : <Copy size={17} />}
            </button>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="h-card">
          <Gift size={19} className="text-brand-600" /> How referrals work
        </h2>
        <ol className="mt-4 space-y-3">
          {(rewards?.howItWorks || []).map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed text-charcoal/65">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="h-card mb-4">
          <Tag size={19} className="text-carrot-600" /> Coupons you can use
        </h2>

        {coupons.length === 0 ? (
          <EmptyState
            icon={Tag}
            size="sm"
            title="No coupons right now"
            description="No public coupons are running at the moment. Check back soon."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {coupons.map((c) => (
              <article key={c.code} className="card relative overflow-hidden p-5">
                <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-carrot-50" />
                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <code className="font-mono text-lg font-extrabold text-carrot-700">{c.code}</code>
                    <button
                      onClick={() => copy(c.code)}
                      aria-label={'Copy ' + c.code}
                      className="grid h-9 w-9 place-items-center rounded-xl bg-black/[.04] text-charcoal/50 transition hover:bg-black/10"
                    >
                      <Copy size={15} />
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/65">{c.description}</p>
                  <p className="mt-3 text-xs text-charcoal/45">
                    {c.minOrderValue > 0 && 'Minimum order ' + formatINR(c.minOrderValue) + ' \u00b7 '}
                    Valid till {formatDate(c.expiresAt)}
                    {c.firstOrderOnly && ' \u00b7 First order only'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Button to="/menu" variant="accent" size="lg" className="w-full sm:w-auto">
        Use a coupon on your next order
      </Button>
    </div>
  );
}
