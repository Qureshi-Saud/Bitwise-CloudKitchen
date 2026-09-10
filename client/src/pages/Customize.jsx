import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SlidersHorizontal, Salad, Wheat, Sandwich, CupSoda, CookingPot, Sparkles } from 'lucide-react';
import Section, { SectionHeading } from '../components/ui/Section';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import Badge, { FoodTypeMark } from '../components/ui/Badge';
import CustomizeDialog from '../components/product/CustomizeDialog';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { catalogueApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatINR, cn } from '../lib/utils';

const ICONS = { Salad, Wheat, Sandwich, CupSoda, CookingPot };

/** Plain-language description of what each category lets you change. */
const WHAT_YOU_CAN_CHANGE = {
  'salad-bowls': 'Base, protein, vegetables, seeds and dressing',
  wraps: 'Wrap type, filling, vegetables and sauces',
  sandwiches: 'Bread, add-ons and spread',
  cutlets: 'Portion size and dip',
  smoothies: 'Milk or yogurt base, chia or flax, peanut butter, extra fruit, oats and optional protein',
  'oats-jars': 'Fruits, nuts, seeds, chia, flax, cocoa and peanut butter',
};

export default function Customize() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [active, setActive] = useState('all');
  const [loading, setLoading] = useState(true);
  const [customizing, setCustomizing] = useState(null);

  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([catalogueApi.products({ limit: 60 }), catalogueApi.categories()])
      .then(([p, c]) => {
        if (cancelled) return;
        setProducts(p.data.filter((x) => x.isCustomizable));
        setCategories(c.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Deep link: /customize/:slug opens that snack's customizer straight away.
  useEffect(() => {
    if (!slug) return;
    catalogueApi
      .product(slug)
      .then((res) => setCustomizing(res.data.product))
      .catch(() => toast.error('We could not open that snack'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const visible = active === 'all' ? products : products.filter((p) => p.category?.slug === active);

  return (
    <>
      <PageHeader
        eyebrow="Customize Your Snack"
        icon={SlidersHorizontal}
        title="Make it exactly how you like it"
        subtitle="Swap the base, change the protein, load up on vegetables, pick your seeds and choose your sauce. Every change updates the price and the approximate nutrition instantly - so there are no surprises at checkout."
      />

      <Section pad="tight">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => {
            const Icon = ICONS[c.icon] || Salad;
            return (
              <button
                key={c._id}
                onClick={() => setActive(c.slug)}
                className={cn(
                  'flex items-start gap-3 rounded-3xl border bg-white p-4 text-left transition',
                  active === c.slug ? 'border-brand-500 ring-1 ring-brand-200' : 'border-black/5 hover:border-brand-300'
                )}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                  style={{ backgroundColor: (c.accent || '#16a34a') + '18', color: c.accent || '#16a34a' }}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{c.name}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-charcoal/55">
                    {WHAT_YOU_CAN_CHANGE[c.slug] || 'Fully customizable'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            align="left"
            className="!mb-0"
            title={active === 'all' ? 'All customizable snacks' : categories.find((c) => c.slug === active)?.name}
            subtitle={visible.length + ' snacks you can tailor to your taste'}
          />
          {active !== 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setActive('all')}>
              Show all
            </Button>
          )}
        </div>

        {loading ? (
          <ProductGridSkeleton count={6} cols="sm:grid-cols-2 lg:grid-cols-3" />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Nothing customizable here yet"
            description="Try another category, or browse the full menu."
            actionLabel="Open the menu"
            actionTo="/menu"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <article key={p._id} className="card flex flex-col overflow-hidden">
                <SmartImage
                  src={p.images?.[0]?.url}
                  alt={p.name}
                  width={600}
                  wrapperClassName="aspect-[16/10]"
                />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="flex items-center gap-1.5 font-bold">
                      <FoodTypeMark type={p.foodType} size={13} />
                      {p.name}
                    </h3>
                    <span className="shrink-0 font-extrabold text-brand-700">{formatINR(p.price)}</span>
                  </div>

                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">{p.shortDescription}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.badges || []).slice(0, 3).map((b) => <Badge key={b}>{b}</Badge>)}
                  </div>

                  <p className="mt-3 text-xs text-charcoal/50">
                    <strong className="font-semibold text-charcoal/70">You can change:</strong>{' '}
                    {p.optionGroups?.map((g) => g.title).join(', ')}
                  </p>

                  <Button
                    onClick={() => setCustomizing(p)}
                    icon={SlidersHorizontal}
                    size="md"
                    className="mt-4 w-full"
                  >
                    Customize this snack
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <CustomizeDialog
        product={customizing}
        open={Boolean(customizing)}
        onClose={() => {
          setCustomizing(null);
          if (slug) navigate('/customize', { replace: true });
        }}
        onAddToCart={(item) => {
          addItem(item);
          toast.success('Your customized snack is in the cart');
        }}
      />
    </>
  );
}
