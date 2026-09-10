import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, FreeMode } from 'swiper/modules';
import {
  ArrowRight, Leaf, HeartPulse, ShieldCheck, IndianRupee, Sparkles, Truck,
  Star, Timer, CheckCircle2, Package,
} from 'lucide-react';
import 'swiper/css';
import 'swiper/css/free-mode';

import Section, { SectionHeading, Reveal, CtaCard } from '../components/ui/Section';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import ProductCard from '../components/product/ProductCard';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import CustomizeDialog from '../components/product/CustomizeDialog';
import SearchBar from '../components/product/SearchBar';
import { catalogueApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { HOW_IT_WORKS } from '../lib/constants';
import { useSettings } from '../context/SettingsContext';
import { formatINR } from '../lib/utils';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=80';

const WHY_US = (minOrder) => [
  { icon: Leaf, title: 'Fresh Ingredients', text: 'Vegetables, fruit and dairy bought the same morning. Nothing sits overnight.', tone: 'bg-brand-50 text-brand-700' },
  { icon: HeartPulse, title: 'Nutrition-Focused', text: 'Calories, protein, carbs, fat and fibre printed on every single snack.', tone: 'bg-rose-50 text-rose-600' },
  { icon: ShieldCheck, title: 'Hygienically Prepared', text: 'Sanitised prep stations, gloves, hairnets and tamper-evident packaging.', tone: 'bg-sky-50 text-sky-600' },
  { icon: IndianRupee, title: 'Affordable', text: 'Honest pricing that starts at just ' + minOrder + '. No hidden charges, ever.', tone: 'bg-amber-50 text-amber-700' },
  { icon: Sparkles, title: 'Wholesome Choices', text: 'Whole grains, oats, millets, sprouts and real fruit. Never deep fried.', tone: 'bg-violet-50 text-violet-600' },
  { icon: Truck, title: 'Convenient Delivery', text: 'Pick a slot that suits your day and track your snack right to the door.', tone: 'bg-carrot-50 text-carrot-600' },
];

const TRUST = (minOrder) => [
  { icon: Timer, label: 'Made in 15-25 min' },
  { icon: Package, label: 'From ' + minOrder + ' onwards' },
  { icon: CheckCircle2, label: 'No subscription needed' },
];

export default function Home() {
  const settings = useSettings();
  const [popular, setPopular] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customizing, setCustomizing] = useState(null);
  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([catalogueApi.popular(8), catalogueApi.categories()])
      .then(([p, c]) => {
        if (cancelled) return;
        setPopular(p.data);
        setCategories(c.data);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const quickAdd = (product) => {
    addItem({
      kind: 'product',
      productId: product._id,
      quantity: 1,
      customizations: [],
      meta: { name: product.name, image: product.images?.[0]?.url },
    });
    toast.success(product.name + ' added to your cart');
  };

  // Everything below reads from Admin Panel -> Organization: the hero headline
  // is the saved tagline (split at its first comma so the second half can be
  // colour-accented) and every price mention is the saved minimum order value.
  const minOrder = formatINR(settings.minOrderValue);
  const comma = (settings.tagline || '').indexOf(',');
  const headline = comma > -1 ? settings.tagline.slice(0, comma + 1) : settings.tagline;
  const headlineRest = comma > -1 ? settings.tagline.slice(comma + 1).trim() : '';
  const trust = TRUST(minOrder);
  const whyUs = WHY_US(minOrder);

  return (
    <>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden bg-hero-grain">
        <div className="container grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="chip-eyebrow"
            >
              <Leaf size={13} /> {settings.brandName}{settings.city && <> &middot; {settings.city}</>}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mt-4 text-[2rem] font-extrabold leading-[1.08] xs:text-4xl sm:text-5xl lg:text-6xl"
            >
              {headline}
              {headlineRest && <span className="block text-brand-700">{headlineRest}</span>}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-5 max-w-xl text-sm leading-relaxed text-charcoal/65 sm:text-base lg:text-lg"
            >
              Fresh salad bowls, protein wraps, grilled sandwiches, pan-seared cutlets, real-fruit smoothies
              and overnight oats jars - cooked to order in a hygienic cloud kitchen and delivered to your desk,
              hostel or home. Order one snack or ten, whenever you like. Starting at just {minOrder}.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <Button to="/menu" variant="accent" size="lg" iconRight={ArrowRight}>
                ORDER NOW
              </Button>
              <Button to="/menu" variant="outline" size="lg">
                EXPLORE SNACKS
              </Button>
            </motion.div>

            <div className="mt-7 max-w-md lg:hidden">
              <SearchBar />
            </div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.26 }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3"
            >
              {trust.map((t) => (
                <li key={t.label} className="flex items-center gap-2 text-sm font-semibold text-charcoal/70">
                  <t.icon size={16} className="text-brand-600" /> {t.label}
                </li>
              ))}
            </motion.ul>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <SmartImage
              src={HERO_IMAGE}
              alt="A fresh sprouts and vegetable salad bowl"
              eager
              wrapperClassName="aspect-[4/3.4] rounded-4xl shadow-pop sm:aspect-[4/3]"
            />

            <div className="absolute -bottom-4 left-1 flex max-w-[calc(100%-0.5rem)] items-center gap-2.5 rounded-2xl bg-white p-2.5 shadow-pop xs:gap-3 xs:p-3 sm:-bottom-5 sm:left-6">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 xs:h-11 xs:w-11">
                <HeartPulse size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold xs:text-sm">Full nutrition shown</p>
                <p className="text-[10px] text-charcoal/55 xs:text-[11px]">On every single snack</p>
              </div>
            </div>

            <div className="absolute -top-3 right-1 flex max-w-[calc(100%-0.5rem)] items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-pop sm:-top-4 sm:right-6 sm:px-3.5 sm:py-2.5">
              <Star size={16} className="shrink-0 fill-amber-400 text-amber-400" />
              <div className="min-w-0">
                <p className="text-xs font-extrabold leading-none xs:text-sm">4.8 / 5</p>
                <p className="mt-0.5 hidden text-[11px] text-charcoal/55 xs:block">Loved by students &amp; professionals</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --------------------------- Category strip -------------------------- */}
      {categories.length > 0 && (
        <section className="border-y border-black/5 bg-white py-6">
          <div className="container">
            <Swiper
              modules={[FreeMode, Autoplay]}
              freeMode
              slidesPerView="auto"
              spaceBetween={12}
              autoplay={{ delay: 2600, disableOnInteraction: true }}
              className="!overflow-visible"
            >
              {categories.map((c) => (
                <SwiperSlide key={c._id} className="!w-auto">
                  <Link
                    to={'/menu?categories=' + c.slug}
                    className="flex items-center gap-3 rounded-2xl border border-black/5 bg-cream px-4 py-2.5 transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    <SmartImage src={c.image?.url} alt="" width={80} wrapperClassName="h-10 w-10 rounded-xl" />
                    <span>
                      <span className="block text-sm font-bold">{c.name}</span>
                      <span className="block text-[11px] text-charcoal/50">
                        {c.productCount} items
                        {c.startingPrice ? ' &middot; from ' + formatINR(c.startingPrice) : ''}
                      </span>
                    </span>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>
      )}

      {/* ---------------------------- Why choose us -------------------------- */}
      <Section>
        <SectionHeading
          eyebrow="Why Choose Us"
          title="Snacking you can actually feel good about"
          subtitle={'Six things we refuse to compromise on, whether you order a single cutlet or a full snack box.'}
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyUs.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.06}>
              <article className="card h-full p-6 transition-shadow hover:shadow-pop">
                <span className={'mb-4 grid h-12 w-12 place-items-center rounded-2xl ' + item.tone}>
                  <item.icon size={22} />
                </span>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{item.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ---------------------------- How it works --------------------------- */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="How It Works"
            title="From craving to doorstep in five steps"
            subtitle="No plans to sign up for and nothing to remember. Order the moment you feel like it."
          />

          <ol className="relative grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            <span className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent lg:block" />
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={s.step} delay={i * 0.08}>
                <li className="relative text-center">
                  <span className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-lg font-extrabold text-white shadow-lift">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold">{s.step}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">{s.text}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* --------------------------- Popular snacks -------------------------- */}
      <Section>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="chip-eyebrow">Popular Snacks</span>
            <h2 className="h-section mt-3">What everyone is ordering</h2>
            <p className="mt-2 max-w-xl text-sm text-charcoal/60 sm:text-base">
              Our most-loved snacks this week, with full nutrition on every card.
            </p>
          </div>
          <Button to="/menu" variant="outline" size="md" iconRight={ArrowRight}>
            View Full Menu
          </Button>
        </div>

        {loading ? (
          <ProductGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popular.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} onAdd={quickAdd} onCustomize={setCustomizing} />
            ))}
          </div>
        )}
      </Section>

      {/* ------------------------- Snack box highlight ------------------------ */}
      <section className="section bg-brand-800 text-white">
        <div className="container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="chip-invert">One-time box &middot; No subscription</span>
            <h2 className="h-section mt-4">Build your own snack box, exactly your way</h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
              Mix salad bowls, wraps, sandwiches, cutlets, smoothies and oats jars into one box. Add extras like
              paneer, seeds, nuts, fruit, hummus, yogurt dip or chia. The total updates live and you see the full
              summary before anything reaches your cart. It is a single order - never a plan, never auto-renewed.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/snack-box" variant="white" size="lg" iconRight={ArrowRight}>
                Build a Snack Box
              </Button>
              <Button to="/customize" variant="ghost" size="lg" className="text-white hover:bg-white/10">
                Customize a snack
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              'https://images.unsplash.com/photo-1600335895229-6e75511892c8?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=600&q=80',
              'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
            ].map((src, i) => (
              <SmartImage
                key={src}
                src={src}
                alt=""
                width={600}
                wrapperClassName={'aspect-square rounded-3xl ' + (i % 2 ? 'mt-6' : '')}
              />
            ))}
          </div>
        </div>
      </section>

      {/* -------------------------------- CTA -------------------------------- */}
      <Section>
        <CtaCard
          title="Hungry now? Your snack is 20 minutes away."
          actions={
            <>
              <Button to="/menu" variant="accent" size="lg" iconRight={ArrowRight}>
                ORDER NOW
              </Button>
              <Button to="/nutrition" variant="outline" size="lg">
                Check Nutrition
              </Button>
            </>
          }
        >
          No plans, no commitments, no minimum weekly orders. Just pick what you are craving and we will make
          it fresh.
        </CtaCard>
      </Section>

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
