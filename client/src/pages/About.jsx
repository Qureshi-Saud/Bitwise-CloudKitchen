import {
  Target, Eye, Leaf, ShieldCheck, Scale, Home, Package, ClipboardList, IndianRupee, ArrowRight,
} from 'lucide-react';
import Section, { SectionHeading, Reveal, CtaCard } from '../components/ui/Section';
import Button from '../components/ui/Button';
import SmartImage from '../components/ui/SmartImage';
import { useSettings } from '../context/SettingsContext';
import { listAreas } from '../lib/copy';
import { formatINR } from '../lib/utils';

const FOCUS = (minOrder) => [
  {
    icon: Leaf,
    title: 'Fresh ingredients',
    text: 'Vegetables, fruit, curd and paneer are bought the same morning from local suppliers. Nothing is frozen, nothing carries over to the next day.',
  },
  {
    icon: ShieldCheck,
    title: 'Hygienic preparation',
    text: 'Sanitised prep counters, colour-coded boards for veg and non-veg, gloves, hairnets and tamper-evident packaging on every order.',
  },
  {
    icon: Scale,
    title: 'Balanced recipes',
    text: 'Every recipe is built around protein and fibre first. We grill, steam and pan-sear instead of deep frying, and we keep oil to a spoon.',
  },
  {
    icon: Home,
    title: 'Home-style Indian flavours',
    text: 'Mint chutney, tikka masala, chaat masala, roasted sesame, brown chana. Familiar tastes you grew up with - just made lighter.',
  },
  {
    icon: Package,
    title: 'Convenient portions',
    text: 'Single-serve bowls, wraps and sealed jars sized for one person. Easy to eat at a desk, in a hostel room or between classes.',
  },
  {
    icon: ClipboardList,
    title: 'Transparent nutrition',
    text: 'Calories, protein, carbs, fat and fibre printed on every card - plus iron, calcium, potassium and vitamin A on the product page.',
  },
  {
    icon: IndianRupee,
    title: 'Affordable pricing',
    text: 'Snacks start at ' + minOrder + '. No membership fee, no minimum weekly spend and no charge you did not choose to make.',
  },
];

export default function About() {
  const settings = useSettings();
  const focus = FOCUS(formatINR(settings.minOrderValue));

  return (
    <>
      <section className="bg-hero-grain">
        <div className="container grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="chip-eyebrow">Our Story</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Good food should not be a project
            </h1>
            <p className="mt-5 leading-relaxed text-charcoal/65">
              {settings.brandName} started with a simple, slightly frustrating observation: eating well between
              meals is far harder than it should be. If you are a student in a hostel, a professional stuck at a
              desk, or someone living away from home for the first time, your options at 5 PM are usually a packet
              of chips, a plate of something deep fried, or nothing at all.
            </p>
            <p className="mt-4 leading-relaxed text-charcoal/65">
              We wanted a third option. Not a diet plan, not a weekly tiffin you have to commit to and then forget
              about, and definitely not a subscription that quietly renews every month. Just genuinely fresh,
              genuinely nutritious snacks that you can order the exact moment you feel like eating - one at a time,
              starting at {formatINR(100)}.
            </p>
            <p className="mt-4 leading-relaxed text-charcoal/65">
              So we built a cloud kitchen around that idea. No dining room, no waiters, no overheads to pass on to
              you. Every rupee goes into better ingredients and a cleaner kitchen.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/menu" variant="accent" size="lg" iconRight={ArrowRight}>
                Explore the menu
              </Button>
              <Button to="/contact" variant="outline" size="lg">
                Talk to us
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SmartImage
              src="https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=700&q=80"
              alt="Fresh vegetables being prepared"
              eager
              wrapperClassName="aspect-[3/4] rounded-3xl shadow-card"
            />
            <SmartImage
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80"
              alt="A prepared salad bowl"
              wrapperClassName="mt-8 aspect-[3/4] rounded-3xl shadow-card"
            />
          </div>
        </div>
      </section>

      {/* ---------------------------- Mission & vision --------------------------- */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <article className="card h-full bg-brand-700 p-8 text-white">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                <Target size={22} />
              </span>
              <h2 className="h-card mt-5">Our Mission</h2>
              <p className="mt-3 leading-relaxed text-white/80">
                To make fresh, nutritious and hygienically prepared snacks so easy and affordable to order that
                eating well between meals stops being a decision you have to plan for. Every snack we send out
                should be something we would happily feed our own family - honestly priced, honestly labelled,
                and available on demand rather than on a schedule.
              </p>
            </article>
          </Reveal>

          <Reveal delay={0.08}>
            <article className="card h-full p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-carrot-50 text-carrot-600">
                <Eye size={22} />
              </span>
              <h2 className="h-card mt-5">Our Vision</h2>
              <p className="mt-3 leading-relaxed text-charcoal/65">
                To become the snack kitchen that students, working professionals and people living away from home
                reach for first - known not for gimmicks or wellness claims, but for consistency: the same fresh
                ingredients, the same clean kitchen and the same honest nutrition label, order after order, in
                every city we reach.
              </p>
            </article>
          </Reveal>
        </div>
      </Section>

      {/* --------------------------------- Focus -------------------------------- */}
      <section className="section bg-white">
        <div className="container">
          <SectionHeading
            eyebrow="What we focus on"
            title="Seven things we get right, every single order"
            subtitle="These are not marketing lines. They are the rules our kitchen actually runs on."
          />

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {focus.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <article className="card h-full p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                    <f.icon size={20} />
                  </span>
                  <h3 className="h-card mt-4">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal/60">{f.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- No subscription --------------------------- */}
      <Section>
        <CtaCard
          className="mx-auto max-w-3xl"
          title="A quick word on what we are not"
          actions={
            <>
              <Button to="/menu" variant="accent" size="lg">Order a snack</Button>
              <Button to="/snack-box" variant="outline" size="lg">Build a one-time box</Button>
            </>
          }
        >
          We do not run tiffin services. We do not sell daily, weekly or monthly plans. There is no membership
          to buy, nothing renews automatically, and you will never be charged for a snack you did not actively
          order. The only bundle we offer is a one-time Snack Box you assemble yourself - and even that is a
          single order, not a commitment.
        </CtaCard>
      </Section>

      {/* ------------------------------- Location -------------------------------- */}
      <section className="section bg-charcoal text-white">
        <div className="container grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="chip-invert">Where we cook</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold">One kitchen, made for delivery</h2>
            <p className="mt-4 leading-relaxed text-white/70">
              Our kitchen in {settings.city} is built for one job: getting fresh food out of the door fast
              and safely. Separate veg and non-veg prep lines, refrigerated ingredient storage, daily deep cleans
              and staff trained on food-safety basics before they touch a single ingredient.
            </p>
            <p className="mt-4 leading-relaxed text-white/70">
              We currently deliver across {listAreas(settings.serviceAreas)}, with slots from breakfast through
              dinner.
            </p>
            <Button to="/contact" variant="white" size="lg" className="mt-7">
              See delivery areas
            </Button>
          </div>

          <SmartImage
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80"
            alt="A clean professional kitchen"
            wrapperClassName="aspect-[4/3] rounded-3xl"
          />
        </div>
      </section>
    </>
  );
}
