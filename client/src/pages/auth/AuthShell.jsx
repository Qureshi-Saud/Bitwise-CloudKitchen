import { Link } from 'react-router-dom';
import SmartImage from '../../components/ui/SmartImage';
import BrandLogo from '../../components/ui/BrandLogo';
import { useSettings } from '../../context/SettingsContext';
import { formatINR } from '../../lib/utils';

/** The first line quotes the minimum order value the admin has saved. */
const highlights = (minOrder) => [
  'Order individual snacks from ' + minOrder,
  'Full nutrition on every single item',
  'No plans, no subscriptions, ever',
];

/** Split-screen shell shared by every authentication page. */
export default function AuthShell({ title, subtitle, children, footer }) {
  const settings = useSettings();
  const HIGHLIGHTS = highlights(formatINR(settings.minOrderValue));

  return (
    <div className="min-h-below-header grid lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <BrandLogo size={40} className="h-10 w-10" />
            <span className="font-display font-extrabold">{settings.brandName}</span>
          </Link>

          <h1 className="font-display text-2xl font-extrabold xs:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-charcoal/60 sm:text-base">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-charcoal/60">{footer}</div>}
        </div>
      </div>

      <div className="relative hidden lg:block">
        <SmartImage
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80"
          alt=""
          eager
          wrapperClassName="absolute inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/50 to-brand-900/20" />

        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="font-display text-3xl font-extrabold leading-tight">{settings.tagline}</p>
          <ul className="mt-5 space-y-2.5">
            {HIGHLIGHTS.map((h) => (
              <li key={h} className="flex items-center gap-2.5 text-sm text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
