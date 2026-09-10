import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ShoppingCart, SlidersHorizontal, Clock, Info, ChevronRight, Heart, AlertTriangle,
} from 'lucide-react';
import Section, { SectionHeading } from '../components/ui/Section';
import QuantityStepper from '../components/ui/QuantityStepper';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import Badge, { FoodTypeMark } from '../components/ui/Badge';
import Rating from '../components/ui/Rating';
import NutritionStrip from '../components/product/NutritionStrip';
import ProductCard from '../components/product/ProductCard';
import CustomizeDialog from '../components/product/CustomizeDialog';
import { ProductDetailSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { catalogueApi, userApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR, formatDate, initials } from '../lib/utils';
import { NUTRITION_DISCLAIMER } from '../lib/constants';

const MICROS = [
  { key: 'iron', label: 'Iron', unit: 'mg' },
  { key: 'calcium', label: 'Calcium', unit: 'mg' },
  { key: 'potassium', label: 'Potassium', unit: 'mg' },
  { key: 'vitaminA', label: 'Vitamin A', unit: 'mcg' },
];

export default function ProductDetail() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [customizing, setCustomizing] = useState(null);

  const { addItem } = useCart();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setQuantity(1);
    setActiveImage(0);

    catalogueApi
      .product(slug)
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setData(null))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <ProductDetailSkeleton />;
  if (!data?.product) {
    return (
      <Section>
        <EmptyState
          icon={AlertTriangle}
          title="We could not find that snack"
          description="It may have been renamed or taken off the menu for today."
          actionLabel="Back to the menu"
          actionTo="/menu"
        />
      </Section>
    );
  }

  const { product, related, reviews } = data;
  const soldOut = !product.isAvailable || product.stockStatus === 'out-of-stock';
  const isFavourite = user?.favourites?.some((f) => (f._id || f) === product._id);

  const addToCart = () => {
    addItem({
      kind: 'product',
      productId: product._id,
      quantity,
      customizations: [],
      meta: { name: product.name, image: product.images?.[0]?.url },
    });
    toast.success(product.name + ' added to your cart');
  };

  const toggleFavourite = async () => {
    if (!isAuthenticated) return toast.info('Sign in to save your favourites');
    try {
      await userApi.toggleFavourite(product._id);
      await refreshUser();
      toast.success(isFavourite ? 'Removed from favourites' : 'Saved to favourites');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="border-b border-black/5 bg-white">
        <nav aria-label="Breadcrumb" className="container flex flex-wrap items-center gap-x-1.5 gap-y-1 py-3 text-xs text-charcoal/50 sm:py-4 sm:text-sm">
          <Link to="/" className="hover:text-charcoal">Home</Link>
          <ChevronRight size={14} />
          <Link to="/menu" className="hover:text-charcoal">Menu</Link>
          <ChevronRight size={14} />
          <Link to={'/menu?categories=' + product.category?.slug} className="hover:text-charcoal">
            {product.category?.name}
          </Link>
          <ChevronRight size={14} />
          <span className="truncate font-medium text-charcoal">{product.name}</span>
        </nav>
      </div>

      <Section pad="flush">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <SmartImage
              src={product.images?.[activeImage]?.url}
              alt={product.images?.[activeImage]?.alt || product.name}
              eager
              width={900}
              wrapperClassName="aspect-[4/3] rounded-3xl shadow-card"
            />
            {product.images?.length > 1 && (
              <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={img.url}
                    onClick={() => setActiveImage(i)}
                    aria-label={'View image ' + (i + 1)}
                    className={
                      'shrink-0 overflow-hidden rounded-2xl ring-2 transition ' +
                      (i === activeImage ? 'ring-brand-600' : 'ring-transparent hover:ring-brand-200')
                    }
                  >
                    <SmartImage src={img.url} alt="" width={200} wrapperClassName="h-16 w-16 sm:h-20 sm:w-20" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <FoodTypeMark type={product.foodType} size={18} showLabel />
              {product.reviewCount > 0 && <Rating value={product.rating} count={product.reviewCount} size={16} />}
              <span className="flex items-center gap-1.5 text-sm text-charcoal/50">
                <Clock size={14} /> Ready in ~{product.prepTimeMinutes} min
              </span>
            </div>

            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight xs:text-3xl sm:text-4xl">{product.name}</h1>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/65 sm:text-base">
              {product.description || product.shortDescription}
            </p>

            {product.badges?.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {product.badges.map((b) => <Badge key={b}>{b}</Badge>)}
              </div>
            )}

            <div className="mt-6 flex items-end gap-3">
              <span className="text-3xl font-extrabold text-brand-700 sm:text-4xl">{formatINR(product.price)}</span>
              {product.compareAtPrice > product.price && (
                <span className="mb-1 text-lg text-charcoal/35 line-through">{formatINR(product.compareAtPrice)}</span>
              )}
              <span className="mb-1.5 text-sm text-charcoal/50">/ {product.servingSize}</span>
            </div>

            {soldOut ? (
              <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                This snack is sold out for today. Check back tomorrow morning.
              </p>
            ) : (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <QuantityStepper
                  size="lg"
                  solid
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={20}
                />

                <Button onClick={addToCart} icon={ShoppingCart} size="lg" className="grow basis-[13rem] sm:grow-0">
                  Add to Cart &middot; {formatINR(product.price * quantity)}
                </Button>

                {product.isCustomizable && (
                  <Button
                    onClick={() => setCustomizing(product)}
                    variant="outline"
                    size="lg"
                    icon={SlidersHorizontal}
                    className="grow basis-[9rem] sm:grow-0"
                  >
                    Customize
                  </Button>
                )}

                <button
                  onClick={toggleFavourite}
                  aria-label={isFavourite ? 'Remove from favourites' : 'Save to favourites'}
                  className={
                    'grid h-12 w-12 place-items-center rounded-full border-2 transition ' +
                    (isFavourite ? 'border-rose-400 bg-rose-50 text-rose-500' : 'border-black/10 text-charcoal/40 hover:border-rose-300 hover:text-rose-500')
                  }
                >
                  <Heart size={19} className={isFavourite ? 'fill-current' : ''} />
                </button>
              </div>
            )}

            <div className="mt-8 rounded-3xl border border-black/5 bg-white p-5">
              <h2 className="h-card mb-3">Nutrition per {product.servingSize}</h2>
              <NutritionStrip nutrition={product.nutrition} />

              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {MICROS.map((m) => (
                  <div key={m.key} className="rounded-2xl bg-cream px-3 py-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">{m.label}</dt>
                    <dd className="mt-0.5 text-sm font-extrabold">
                      {product.nutrition?.[m.key] || 0} {m.unit}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-relaxed text-charcoal/45">
                <Info size={12} className="mt-px shrink-0" />
                {NUTRITION_DISCLAIMER}
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-black/5 bg-white p-5">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-charcoal/45">Ingredients</h3>
                <p className="text-sm leading-relaxed text-charcoal/70">
                  {product.ingredients?.join(', ') || 'Ingredient list coming soon.'}
                </p>
              </div>
              <div className="rounded-3xl border border-black/5 bg-white p-5">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-charcoal/45">Allergen information</h3>
                <p className="text-sm leading-relaxed text-charcoal/70">
                  {product.allergens?.length ? 'Contains ' + product.allergens.join(', ') + '.' : 'No common allergens declared.'}
                  {' '}If you have a food allergy or medical condition, please consult a qualified professional before ordering.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {reviews?.length > 0 && (
        <section className="section bg-white">
          <div className="container">
            <SectionHeading align="left" title="What customers said" subtitle={product.reviewCount + ' verified reviews'} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r) => (
                <article key={r._id} className="card p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {initials(r.user?.name)}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{r.user?.name}</p>
                      <p className="text-[11px] text-charcoal/45">{formatDate(r.createdAt)}</p>
                    </div>
                    <Rating value={r.rating} showValue={false} className="ml-auto" />
                  </div>
                  {r.title && <h3 className="mt-3 text-sm font-bold">{r.title}</h3>}
                  {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-charcoal/65">{r.comment}</p>}
                  {r.adminReply?.text && (
                    <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs leading-relaxed text-charcoal/60">
                      <strong className="text-brand-700">Kitchen replied:</strong> {r.adminReply.text}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {related?.length > 0 && (
        <Section>
          <SectionHeading align="left" title="You may also like" subtitle={'More from ' + product.category?.name} />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard
                key={p._id}
                product={p}
                index={i}
                onAdd={(prod) => {
                  addItem({ kind: 'product', productId: prod._id, quantity: 1, customizations: [], meta: { name: prod.name } });
                  toast.success(prod.name + ' added to your cart');
                }}
                onCustomize={setCustomizing}
              />
            ))}
          </div>
        </Section>
      )}

      <CustomizeDialog
        product={customizing}
        open={Boolean(customizing)}
        onClose={() => setCustomizing(null)}
        onAddToCart={(item) => {
          addItem(item);
          toast.success('Added to your cart');
        }}
      />
    </>
  );
}
