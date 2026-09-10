import { Link } from 'react-router-dom';
import { Salad, Home, UtensilsCrossed } from 'lucide-react';
import Section from '../components/ui/Section';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <Section>
      <div className="mx-auto max-w-lg py-10 text-center">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-4xl bg-brand-50 text-brand-600">
          <Salad size={44} />
        </span>

        <p className="mt-8 font-display text-6xl font-extrabold text-brand-700">404</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">This page is off the menu</h1>
        <p className="mt-3 leading-relaxed text-charcoal/60">
          The page you were looking for does not exist, or it moved somewhere else. The good news is that lunch
          is still on.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/" variant="outline" size="lg" icon={Home}>Back to home</Button>
          <Button to="/menu" variant="accent" size="lg" icon={UtensilsCrossed}>Browse the menu</Button>
        </div>

        <p className="mt-8 text-sm text-charcoal/50">
          Looking for an order? Try the{' '}
          <Link to="/track-order" className="font-semibold underline underline-offset-2">Track Order</Link> page.
        </p>
      </div>
    </Section>
  );
}
