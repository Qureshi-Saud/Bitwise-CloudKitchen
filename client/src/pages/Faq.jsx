import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageCircle, Search } from 'lucide-react';
import Section from '../components/ui/Section';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { useSettings } from '../context/SettingsContext';
import { fillCopy } from '../lib/copy';
import { cn } from '../lib/utils';

const FAQS = [
  {
    group: 'Ordering',
    items: [
      {
        q: 'Can I order just one snack, or do I have to buy a plan?',
        a: 'You can order a single snack any time you like. There are no plans of any kind on this website - no daily tiffin, no weekly plan, no monthly plan and no membership. Add what you want to the cart, pay once, and that is it.',
      },
      {
        q: 'Do you run a tiffin service or subscription?',
        a: 'No. We are an on-demand snack kitchen only. Nothing on this site renews automatically and you will never be charged for food you did not actively order. The Snack Box is the only bundle we offer, and it is a one-time box you assemble yourself.',
      },
      {
        q: 'What is the starting price?',
        a: 'Most items sit in the Rs. 100 to Rs. 160 band. The minimum order value is {{minOrderValue}}.',
      },
      {
        q: 'What is a Snack Box and how is it different from a plan?',
        a: 'A Snack Box lets you combine 2 to 8 snacks from any category into one order, with optional extras like extra paneer, seeds, nuts, fruit, hummus, yogurt dip or chia seeds. It is placed and paid for once, exactly like any other order. It does not repeat and it does not renew.',
      },
      {
        q: 'Can I place a bulk order for an office or an event?',
        a: 'Yes. For 15 portions or more, write to us through the Contact page or WhatsApp us at least 24 hours ahead and we will confirm quantities, timing and pricing.',
      },
    ],
  },
  {
    group: 'Food & Nutrition',
    items: [
      {
        q: 'Can I customize a snack?',
        a: 'Almost everything is customizable. Salads let you choose the base, protein, vegetables, seeds and dressing. Wraps let you pick the wrap type, filling, vegetables and sauces. Smoothies let you choose your milk or yogurt base, chia or flax, peanut butter, extra fruit, oats and an optional protein scoop. Oats jars let you add fruits, nuts, seeds, chia, flax, cocoa or peanut butter. The price and approximate nutrition update live as you choose.',
      },
      {
        q: 'Do you have vegetarian and non-vegetarian options?',
        a: 'Both. Every product card carries the standard green (vegetarian) or red (non-vegetarian) mark, and you can filter the entire menu by either. Veg and non-veg are prepared on separate boards and stations.',
      },
      {
        q: 'Which snacks are highest in protein?',
        a: 'Our Chicken Tikka Wrap, Chicken Cutlets, Paneer Quinoa Salad, Paneer Tikka Wrap and Yogurt Oats with Fruits all carry the HIGH PROTEIN badge, meaning 15g of protein or more per serving. You can also filter the menu or the Nutrition page by High Protein.',
      },
      {
        q: 'Where does the nutrition information come from?',
        a: 'Values are calculated from standard ingredient composition tables against our own recipe quantities and portion sizes. They are approximate and may vary according to ingredients, preparation method and portion size. We publish them for transparency and make no medical, disease-treatment or therapeutic claims.',
      },
      {
        q: 'I have an allergy or a medical condition. Can you advise me?',
        a: 'We list the full ingredients and declared allergens for every snack on its product page, and our chatbot can pull that information up for you. We are not able to give medical or therapeutic dietary advice - for any allergy or medical condition, please consult a qualified doctor or a registered dietitian before ordering.',
      },
      {
        q: 'How do you keep the kitchen hygienic?',
        a: 'Everything is cooked to order. We use sanitised prep counters, separate colour-coded boards for veg and non-veg, gloves and hairnets, refrigerated ingredient storage, daily deep cleans and tamper-evident packaging. Nothing is pre-fried or reheated from yesterday.',
      },
    ],
  },
  {
    group: 'Payment & Delivery',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'UPI, credit and debit cards, netbanking and wallets through Razorpay, plus Cash on Delivery where available. Card details are handled entirely by Razorpay - we never see or store them.',
      },
      {
        q: 'What are your delivery timings?',
        a: 'We deliver in slots from breakfast (8:00 AM) through dinner (9:30 PM), all days. You choose your date and slot at checkout, and each slot closes shortly before it begins so the kitchen has time to cook.',
      },
      {
        q: 'Where do you deliver?',
        a: 'Across {{city}} - {{areas}}. Delivery is {{deliveryFee}}, and free on orders above {{freeDeliveryAbove}}.',
      },
      {
        q: 'Can I cancel an order?',
        a: 'Yes, as long as it has not been packed yet. Open the order under My Orders and cancel it there. Once food is packed we cannot cancel it, because it has already been made fresh for you.',
      },
      {
        q: 'How do I track my order?',
        a: 'Every order moves through Confirmed, Preparing, Packed, Out for Delivery and Delivered. Open the Track Order page and enter your order number - the status updates live as our kitchen moves it along.',
      },
    ],
  },
];

function Item({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-black/5 last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="font-semibold leading-snug">{faq.q}</span>
        <ChevronDown
          size={19}
          className={cn('mt-0.5 shrink-0 text-charcoal/40 transition-transform', isOpen && 'rotate-180 text-brand-600')}
        />
      </button>
      <div
        className={cn(
          'grid overflow-hidden transition-all duration-300',
          isOpen ? 'grid-rows-[1fr] pb-5 opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <p className="min-h-0 pr-8 text-sm leading-relaxed text-charcoal/65">{faq.a}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  const settings = useSettings();
  const [openKey, setOpenKey] = useState('0-0');
  const [query, setQuery] = useState('');

  const term = query.trim().toLowerCase();
  // Answers carry {{brand}} / {{areas}} / {{deliveryFee}} style tokens, filled
  // from the admin settings before searching so the filter matches what is read.
  const groups = FAQS.map((g) => {
    const items = g.items.map((i) => ({ ...i, a: fillCopy(i.a, settings) }));
    return {
      ...g,
      items: term ? items.filter((i) => (i.q + ' ' + i.a).toLowerCase().includes(term)) : items,
    };
  }).filter((g) => g.items.length);

  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        subtitle="Everything about ordering, customization, nutrition, payment, hygiene and delivery. If your question is not here, our team is one message away."
      >
        <div className="relative mt-6 max-w-lg">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the FAQ..."
            aria-label="Search frequently asked questions"
            className="input rounded-full pl-11"
          />
        </div>
      </PageHeader>

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-8">
            {groups.length === 0 ? (
              <EmptyState
                icon={Search}
                size="sm"
                title="No matching questions"
                description={'Nothing matched "' + query + '". Try a different word, or ask us directly.'}
              />
            ) : (
              groups.map((group, gi) => (
                <section key={group.group} className="card p-6">
                  <h2 className="h-card mb-2">{group.group}</h2>
                  {group.items.map((faq, ii) => {
                    const key = gi + '-' + ii;
                    return (
                      <Item
                        key={faq.q}
                        faq={faq}
                        isOpen={openKey === key}
                        onToggle={() => setOpenKey(openKey === key ? null : key)}
                      />
                    );
                  })}
                </section>
              ))
            )}
          </div>

          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <div className="card bg-brand-700 p-6 text-white">
              <MessageCircle size={26} />
              <h2 className="h-card mt-4">Still have a question?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Our team replies within support hours ({settings.supportHours}). You can also ask Snack Buddy,
                our in-app assistant, at the bottom-right of any page.
              </p>
              <div className="mt-5 space-y-2">
                <Button href={settings.whatsappLink} target="_blank" rel="noreferrer" variant="white" size="md" className="w-full">
                  ORDER ON WHATSAPP
                </Button>
                <Button to="/contact" variant="ghost" size="md" className="w-full text-white hover:bg-white/10">
                  Contact the team
                </Button>
              </div>
            </div>

            <div className="card mt-4 p-5">
              <h3 className="h-card">Useful links</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  { to: '/menu', label: 'Browse the full menu' },
                  { to: '/nutrition', label: 'Nutrition guide' },
                  { to: '/track-order', label: 'Track an order' },
                  { to: '/refund-policy', label: 'Refund & cancellation' },
                ].map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="font-medium text-charcoal/70 underline-offset-2 hover:text-brand-700 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
