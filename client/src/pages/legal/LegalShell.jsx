import { Link } from 'react-router-dom';
import Section from '../../components/ui/Section';
import { useSettings } from '../../context/SettingsContext';
import { fillCopy } from '../../lib/copy';

const PAGES = [
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/refund-policy', label: 'Refund & Cancellation' },
  { to: '/shipping-policy', label: 'Shipping & Delivery' },
];

/**
 * Shared layout for legal pages. `sections` is an array of
 * { heading, paragraphs?: string[], list?: string[] }.
 *
 * Policy copy refers to the business through {{brand}}, {{areas}} and the other
 * tokens in lib/copy, so the text never has to be edited when an admin changes
 * the store name, delivery areas or the money rules.
 */
export default function LegalShell({ title, updated, intro, sections = [] }) {
  const settings = useSettings();
  const fill = (text) => fillCopy(text, settings);

  return (
    <>
      <div className="border-b border-black/5 bg-white">
        <div className="container py-10 sm:py-14">
          <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-charcoal/50">Last updated: {updated}</p>
          {intro && <p className="mt-4 max-w-3xl leading-relaxed text-charcoal/65">{fill(intro)}</p>}
        </div>
      </div>

      <Section>
        <div className="grid gap-10 lg:grid-cols-[1fr_16rem]">
          <article className="max-w-3xl space-y-8">
            {sections.map((s, i) => (
              <section key={s.heading} id={'section-' + i}>
                <h2 className="h-card">
                  {i + 1}. {s.heading}
                </h2>
                {s.paragraphs?.map((p) => (
                  <p key={p.slice(0, 40)} className="mt-3 leading-relaxed text-charcoal/70">
                    {fill(p)}
                  </p>
                ))}
                {s.list && (
                  <ul className="mt-3 space-y-2">
                    {s.list.map((li) => (
                      <li key={li.slice(0, 40)} className="flex gap-2.5 leading-relaxed text-charcoal/70">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <section className="card bg-cream p-6">
              <h2 className="h-card">Questions about this policy?</h2>
              <p className="mt-2 leading-relaxed text-charcoal/70">
                Write to us at{' '}
                <a href={settings.mailtoLink} className="font-semibold text-brand-700 underline underline-offset-2">
                  {settings.supportEmail}
                </a>{' '}
                or call {settings.supportPhone} during support hours ({settings.supportHours}).
              </p>
            </section>
          </article>

          <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
            <nav className="card p-5" aria-label="Legal pages">
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-charcoal/40">Legal</h2>
              <ul className="space-y-2 text-sm">
                {PAGES.map((p) => (
                  <li key={p.to}>
                    <Link
                      to={p.to}
                      className="font-medium text-charcoal/65 underline-offset-2 hover:text-brand-700 hover:underline"
                    >
                      {p.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </Section>
    </>
  );
}
